<?php

// Table "quotes" et lignes de devis (multi-tenant).
// Totaux HT/TVA/TTC recalcules cote serveur depuis les lignes, jamais fournis par le front.
class Quote
{
    public static function all($userId, $search = null, $status = null, $sort = null)
    {
        $sql =
            'SELECT q.id, q.client_id, q.project_id, q.number, q.status, q.total_ttc,
                    q.valid_until, q.created_at, c.first_name, c.last_name, p.title AS project_title
             FROM quotes q
             JOIN clients c ON c.id = q.client_id
             LEFT JOIN projects p ON p.id = q.project_id
             WHERE q.user_id = ?';
        $params = [$userId];

        if ($search) {
            $sql .= ' AND (q.number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR p.title LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($status) {
            $sql .= ' AND q.status = ?';
            $params[] = $status;
        }

        $orders = [
            'recent'       => 'q.created_at DESC',
            'ancien'       => 'q.created_at ASC',
            'montant_desc' => 'q.total_ttc DESC',
            'montant_asc'  => 'q.total_ttc ASC',
        ];
        $sql .= ' ORDER BY ' . (($sort !== null && isset($orders[$sort])) ? $orders[$sort] : 'q.created_at DESC');

        return Database::run($sql, $params)->fetchAll();
    }

    // Devis complet : en-tete, client et lignes.
    public static function find($userId, $id)
    {
        $quote = Database::run(
            'SELECT q.*, c.first_name, c.last_name, p.title AS project_title
             FROM quotes q
             JOIN clients c ON c.id = q.client_id
             LEFT JOIN projects p ON p.id = q.project_id
             WHERE q.id = ? AND q.user_id = ?',
            [$id, $userId]
        )->fetch();

        if (!$quote) {
            return null;
        }

        $quote['items'] = Database::run('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id', [$id])->fetchAll();
        return $quote;
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['client_id']);
        if (!Client::exists($userId, (int) $data['client_id'])) {
            throw new HttpException('Le client indique est introuvable', 422);
        }

        Database::run(
            'INSERT INTO quotes (user_id, client_id, project_id, number, status, valid_until, notes)
             VALUES (:user_id, :client_id, :project_id, :number, :status, :valid_until, :notes)',
            [
                'user_id'     => $userId,
                'client_id'   => (int) $data['client_id'],
                'project_id'  => !empty($data['project_id']) ? (int) $data['project_id'] : null,
                'number'      => self::nextNumber($userId),
                'status'      => isset($data['status']) ? $data['status'] : 'brouillon',
                'valid_until' => !empty($data['valid_until']) ? $data['valid_until'] : null,
                'notes'       => isset($data['notes']) ? $data['notes'] : null,
            ]
        );

        $id = (int) Database::connection()->lastInsertId();
        self::saveItems($id, isset($data['items']) ? $data['items'] : []);
        self::recalculate($id);
        return self::find($userId, $id);
    }

    public static function update($userId, $id, $data)
    {
        Validator::required($data, ['client_id']);
        if (!Client::exists($userId, (int) $data['client_id'])) {
            throw new HttpException('Le client indique est introuvable', 422);
        }

        Database::run(
            'UPDATE quotes SET client_id = :client_id, project_id = :project_id,
                    status = :status, valid_until = :valid_until, notes = :notes
             WHERE id = :id AND user_id = :user_id',
            [
                'client_id'   => (int) $data['client_id'],
                'project_id'  => !empty($data['project_id']) ? (int) $data['project_id'] : null,
                'status'      => isset($data['status']) ? $data['status'] : 'brouillon',
                'valid_until' => !empty($data['valid_until']) ? $data['valid_until'] : null,
                'notes'       => isset($data['notes']) ? $data['notes'] : null,
                'id'          => $id,
                'user_id'     => $userId,
            ]
        );

        if (array_key_exists('items', $data)) {
            Database::run('DELETE FROM quote_items WHERE quote_id = ?', [$id]);
            self::saveItems($id, $data['items']);
        }

        self::recalculate($id);
        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM quotes WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    // Methodes internes.

    private static function saveItems($quoteId, $items)
    {
        foreach ($items as $it) {
            Database::run(
                'INSERT INTO quote_items (quote_id, label, qty, unit_price, tva_rate)
                 VALUES (:quote_id, :label, :qty, :unit_price, :tva_rate)',
                [
                    'quote_id'   => $quoteId,
                    'label'      => isset($it['label']) ? $it['label'] : '',
                    'qty'        => isset($it['qty']) ? $it['qty'] : 1,
                    'unit_price' => isset($it['unit_price']) ? $it['unit_price'] : 0,
                    'tva_rate'   => isset($it['tva_rate']) ? $it['tva_rate'] : 0,
                ]
            );
        }
    }

    // Totaux recalcules depuis les lignes, jamais depuis le front.
    private static function recalculate($quoteId)
    {
        $items = Database::run('SELECT qty, unit_price, tva_rate FROM quote_items WHERE quote_id = ?', [$quoteId])->fetchAll();

        $ht = 0;
        $tva = 0;
        foreach ($items as $it) {
            $ligne = (float) $it['qty'] * (float) $it['unit_price'];
            $ht += $ligne;
            $tva += $ligne * (float) $it['tva_rate'] / 100;
        }
        $ht = round($ht, 2);
        $tva = round($tva, 2);

        Database::run(
            'UPDATE quotes SET total_ht = :ht, total_tva = :tva, total_ttc = :ttc WHERE id = :id',
            ['ht' => $ht, 'tva' => $tva, 'ttc' => $ht + $tva, 'id' => $quoteId]
        );
    }

    // Numero unique par artiste et par an : DEV-AAAA-0001.
    private static function nextNumber($userId)
    {
        $year = (int) date('Y');
        $count = Database::run(
            'SELECT COUNT(*) FROM quotes WHERE user_id = ? AND YEAR(created_at) = ?',
            [$userId, $year]
        )->fetchColumn();
        return sprintf('DEV-%d-%04d', $year, $count + 1);
    }
}
