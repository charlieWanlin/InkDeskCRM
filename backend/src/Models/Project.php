<?php

// Table "projects" : projets de tatouage rattaches aux clients (multi-tenant).
class Project
{
    public static function all($userId, $search = null, $status = null, $sort = null)
    {
        $sql =
            'SELECT p.*, c.first_name, c.last_name
             FROM projects p
             JOIN clients c ON c.id = p.client_id
             WHERE p.user_id = ?';
        $params = [$userId];

        if ($search) {
            $sql .= ' AND (p.title LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR p.style LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($status) {
            $sql .= ' AND p.status = ?';
            $params[] = $status;
        }

        // Avancement calcule cote serveur : seances realisees / seances prevues.
        $avancement =
            '(SELECT COUNT(*) FROM sessions s WHERE s.project_id = p.id AND s.status = \'realisee\')
             / NULLIF(GREATEST(p.planned_sessions,
                 (SELECT COUNT(*) FROM sessions s2 WHERE s2.project_id = p.id)), 0)';
        $orders = [
            'recent'     => 'p.created_at DESC',
            'montant'    => 'p.amount DESC',
            'avancement' => "$avancement DESC",
        ];
        $sql .= ' ORDER BY ' . (($sort !== null && isset($orders[$sort])) ? $orders[$sort] : 'p.created_at DESC');

        return Database::run($sql, $params)->fetchAll();
    }

    // Projet complet : client, seances et photos.
    public static function find($userId, $id)
    {
        $project = Database::run(
            'SELECT p.*, c.first_name, c.last_name
             FROM projects p
             JOIN clients c ON c.id = p.client_id
             WHERE p.id = ? AND p.user_id = ?',
            [$id, $userId]
        )->fetch();

        if (!$project) {
            return null;
        }

        $project['sessions'] = Database::run(
            'SELECT * FROM sessions WHERE project_id = ? ORDER BY scheduled_at',
            [$id]
        )->fetchAll();
        $project['photos'] = Database::run(
            'SELECT * FROM photos WHERE project_id = ? ORDER BY id',
            [$id]
        )->fetchAll();

        return $project;
    }

    public static function exists($userId, $id)
    {
        return (bool) Database::run('SELECT 1 FROM projects WHERE id = ? AND user_id = ?', [$id, $userId])->fetchColumn();
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['client_id', 'title']);

        $values = self::champs($data);
        $values['user_id'] = $userId;

        Database::run(
            'INSERT INTO projects (user_id, client_id, flash_id, title, style, zone, status, amount, planned_sessions)
             VALUES (:user_id, :client_id, :flash_id, :title, :style, :zone, :status, :amount, :planned_sessions)',
            $values
        );

        return self::find($userId, (int) Database::connection()->lastInsertId());
    }

    public static function update($userId, $id, $data)
    {
        Validator::required($data, ['client_id', 'title']);

        $values = self::champs($data);
        $values['id'] = $id;
        $values['user_id'] = $userId;

        Database::run(
            'UPDATE projects SET client_id = :client_id, flash_id = :flash_id, title = :title,
                    style = :style, zone = :zone, status = :status, amount = :amount, planned_sessions = :planned_sessions
             WHERE id = :id AND user_id = :user_id',
            $values
        );

        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM projects WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    private static function champs($data)
    {
        return [
            'client_id'        => (int) (isset($data['client_id']) ? $data['client_id'] : 0),
            'flash_id'         => !empty($data['flash_id']) ? (int) $data['flash_id'] : null,
            'title'            => isset($data['title']) ? $data['title'] : '',
            'style'            => isset($data['style']) ? $data['style'] : null,
            'zone'             => isset($data['zone']) ? $data['zone'] : null,
            'status'           => isset($data['status']) ? $data['status'] : 'en_attente',
            'amount'           => isset($data['amount']) ? $data['amount'] : 0,
            'planned_sessions' => (int) (isset($data['planned_sessions']) ? $data['planned_sessions'] : 1),
        ];
    }
}
