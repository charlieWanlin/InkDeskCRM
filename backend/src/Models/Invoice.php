<?php

// Table "invoices" et lignes de facture (multi-tenant).
// Facture creee directement ou generee depuis un devis.
class Invoice
{
    public static function all($userId, $search = null, $status = null, $sort = null)
    {
        $sql =
            'SELECT i.id, i.client_id, i.quote_id, i.project_id, i.number, i.status, i.total_ttc,
                    i.issued_at, i.due_at, i.paid_at, c.first_name, c.last_name, p.title AS project_title
             FROM invoices i
             JOIN clients c ON c.id = i.client_id
             LEFT JOIN projects p ON p.id = i.project_id
             WHERE i.user_id = ?';
        $params = [$userId];

        if ($search) {
            $sql .= ' AND (i.number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR p.title LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($status) {
            $sql .= ' AND i.status = ?';
            $params[] = $status;
        }

        $orders = [
            'recent'       => 'i.created_at DESC',
            'ancien'       => 'i.created_at ASC',
            'montant_desc' => 'i.total_ttc DESC',
            'montant_asc'  => 'i.total_ttc ASC',
        ];
        $sql .= ' ORDER BY ' . (($sort !== null && isset($orders[$sort])) ? $orders[$sort] : 'i.created_at DESC');

        return Database::run($sql, $params)->fetchAll();
    }

    public static function find($userId, $id)
    {
        $invoice = Database::run(
            'SELECT i.*, c.first_name, c.last_name, p.title AS project_title
             FROM invoices i
             JOIN clients c ON c.id = i.client_id
             LEFT JOIN projects p ON p.id = i.project_id
             WHERE i.id = ? AND i.user_id = ?',
            [$id, $userId]
        )->fetch();

        if (!$invoice) {
            return null;
        }

        $invoice['items'] = Database::run('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id', [$id])->fetchAll();
        return $invoice;
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['client_id']);
        if (!Client::exists($userId, (int) $data['client_id'])) {
            throw new HttpException('Le client indique est introuvable', 422);
        }

        Database::run(
            'INSERT INTO invoices (user_id, client_id, quote_id, project_id, number, status, issued_at, due_at, paid_at)
             VALUES (:user_id, :client_id, :quote_id, :project_id, :number, :status, :issued_at, :due_at, :paid_at)',
            [
                'user_id'    => $userId,
                'client_id'  => (int) $data['client_id'],
                'quote_id'   => !empty($data['quote_id']) ? (int) $data['quote_id'] : null,
                'project_id' => !empty($data['project_id']) ? (int) $data['project_id'] : null,
                'number'     => self::nextNumber($userId),
                'status'     => isset($data['status']) ? $data['status'] : 'emise',
                'issued_at'  => !empty($data['issued_at']) ? $data['issued_at'] : date('Y-m-d'),
                'due_at'     => !empty($data['due_at']) ? $data['due_at'] : null,
                'paid_at'    => !empty($data['paid_at']) ? $data['paid_at'] : null,
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

        // Le statut "payee" renseigne la date de paiement si elle manque.
        $paidAt = !empty($data['paid_at']) ? $data['paid_at'] : null;
        if ((isset($data['status']) ? $data['status'] : '') === 'payee' && !$paidAt) {
            $paidAt = date('Y-m-d');
        }

        Database::run(
            'UPDATE invoices SET client_id = :client_id, project_id = :project_id,
                    status = :status, due_at = :due_at, paid_at = :paid_at
             WHERE id = :id AND user_id = :user_id',
            [
                'client_id'  => (int) $data['client_id'],
                'project_id' => !empty($data['project_id']) ? (int) $data['project_id'] : null,
                'status'     => isset($data['status']) ? $data['status'] : 'emise',
                'due_at'     => !empty($data['due_at']) ? $data['due_at'] : null,
                'paid_at'    => $paidAt,
                'id'         => $id,
                'user_id'    => $userId,
            ]
        );

        if (array_key_exists('items', $data)) {
            Database::run('DELETE FROM invoice_items WHERE invoice_id = ?', [$id]);
            self::saveItems($id, $data['items']);
        }

        self::recalculate($id);
        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM invoices WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    // Creation depuis devis : client, projet et lignes sont repris.
    public static function fromQuote($userId, $quoteId)
    {
        $quote = Quote::find($userId, $quoteId);
        if (!$quote) {
            throw new HttpException('Devis introuvable', 404);
        }

        return self::create($userId, [
            'client_id'  => $quote['client_id'],
            'quote_id'   => $quote['id'],
            'project_id' => $quote['project_id'],
            'items'      => $quote['items'],
        ]);
    }

    // Methodes internes.

    private static function saveItems($invoiceId, $items)
    {
        foreach ($items as $it) {
            Database::run(
                'INSERT INTO invoice_items (invoice_id, label, qty, unit_price, tva_rate)
                 VALUES (:invoice_id, :label, :qty, :unit_price, :tva_rate)',
                [
                    'invoice_id' => $invoiceId,
                    'label'      => isset($it['label']) ? $it['label'] : '',
                    'qty'        => isset($it['qty']) ? $it['qty'] : 1,
                    'unit_price' => isset($it['unit_price']) ? $it['unit_price'] : 0,
                    'tva_rate'   => isset($it['tva_rate']) ? $it['tva_rate'] : 0,
                ]
            );
        }
    }

    private static function recalculate($invoiceId)
    {
        $items = Database::run('SELECT qty, unit_price, tva_rate FROM invoice_items WHERE invoice_id = ?', [$invoiceId])->fetchAll();

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
            'UPDATE invoices SET total_ht = :ht, total_tva = :tva, total_ttc = :ttc WHERE id = :id',
            ['ht' => $ht, 'tva' => $tva, 'ttc' => $ht + $tva, 'id' => $invoiceId]
        );
    }

    // Numero unique par artiste et par an : FAC-AAAA-0001.
    private static function nextNumber($userId)
    {
        $year = (int) date('Y');
        $count = Database::run(
            'SELECT COUNT(*) FROM invoices WHERE user_id = ? AND YEAR(created_at) = ?',
            [$userId, $year]
        )->fetchColumn();
        return sprintf('FAC-%d-%04d', $year, $count + 1);
    }
}
