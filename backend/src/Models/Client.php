<?php

// Table "clients" (multi-tenant) : chaque requete filtre sur $userId.
// Requetes preparees : les valeurs passent par $params (protection contre l'injection SQL).
class Client
{
    // Liste des clients avec recherche, filtres, tri et indicateurs calcules.
    public static function all($userId, $search = null, $status = null, $style = null, $sort = null)
    {
        $sql =
            'SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.style, c.status, c.created_at,
                    (SELECT MAX(s.scheduled_at)
                       FROM sessions s
                       JOIN projects p ON p.id = s.project_id
                       WHERE p.client_id = c.id) AS last_visit,
                    (SELECT COALESCE(SUM(i.total_ttc), 0)
                       FROM invoices i
                       WHERE i.client_id = c.id AND i.status = \'payee\') AS ca_total
             FROM clients c
             WHERE c.user_id = ?';
        $params = [$userId];

        if ($search) {
            $sql .= ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($status) {
            $sql .= ' AND c.status = ?';
            $params[] = $status;
        }
        if ($style) {
            $sql .= ' AND c.style = ?';
            $params[] = $style;
        }

        // Tri par liste blanche : aucune valeur recue n'est inseree directement dans ORDER BY.
        $orders = [
            'recent'   => 'c.created_at DESC',
            'ancien'   => 'c.created_at ASC',
            'nom_asc'  => 'c.last_name ASC',
            'nom_desc' => 'c.last_name DESC',
        ];
        $sql .= ' ORDER BY ' . (($sort !== null && isset($orders[$sort])) ? $orders[$sort] : 'c.created_at DESC');

        return Database::run($sql, $params)->fetchAll();
    }

    // Client par identifiant, ou null si hors tenant.
    public static function find($userId, $id)
    {
        $client = Database::run('SELECT * FROM clients WHERE id = ? AND user_id = ?', [$id, $userId])->fetch();
        return $client ?: null;
    }

    // Verifie l'appartenance du client au tenant.
    public static function exists($userId, $id)
    {
        return (bool) Database::run('SELECT 1 FROM clients WHERE id = ? AND user_id = ?', [$id, $userId])->fetchColumn();
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['first_name', 'last_name']);

        $values = self::champs($data);
        $values['user_id'] = $userId;

        Database::run(
            'INSERT INTO clients
                (user_id, first_name, last_name, email, phone, birthdate, address, allergies, health_notes, notes, style, status)
             VALUES
                (:user_id, :first_name, :last_name, :email, :phone, :birthdate, :address, :allergies, :health_notes, :notes, :style, :status)',
            $values
        );

        return self::find($userId, (int) Database::connection()->lastInsertId());
    }

    public static function update($userId, $id, $data)
    {
        Validator::required($data, ['first_name', 'last_name']);

        $values = self::champs($data);
        $values['id'] = $id;
        $values['user_id'] = $userId;

        Database::run(
            'UPDATE clients SET
                first_name = :first_name, last_name = :last_name, email = :email, phone = :phone,
                birthdate = :birthdate, address = :address, allergies = :allergies,
                health_notes = :health_notes, notes = :notes, style = :style, status = :status
             WHERE id = :id AND user_id = :user_id',
            $values
        );

        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM clients WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    // Normalise les champs client avec valeurs par defaut.
    private static function champs($data)
    {
        return [
            'first_name'   => isset($data['first_name']) ? $data['first_name'] : '',
            'last_name'    => isset($data['last_name']) ? $data['last_name'] : '',
            'email'        => isset($data['email']) ? $data['email'] : null,
            'phone'        => isset($data['phone']) ? $data['phone'] : null,
            'birthdate'    => !empty($data['birthdate']) ? $data['birthdate'] : null,
            'address'      => isset($data['address']) ? $data['address'] : null,
            'allergies'    => isset($data['allergies']) ? $data['allergies'] : null,
            'health_notes' => isset($data['health_notes']) ? $data['health_notes'] : null,
            'notes'        => isset($data['notes']) ? $data['notes'] : null,
            'style'        => isset($data['style']) ? $data['style'] : null,
            'status'       => isset($data['status']) ? $data['status'] : 'prospect',
        ];
    }
}
