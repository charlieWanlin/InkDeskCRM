<?php

// Table "sessions" : seances/rendez-vous rattaches aux projets.
class Session
{
    // Seances du tenant avec projet et client, pour le calendrier.
    public static function all($userId)
    {
        return Database::run(
            'SELECT s.*, p.title AS project_title, c.id AS client_id,
                    c.first_name, c.last_name
             FROM sessions s
             JOIN projects p ON p.id = s.project_id
             JOIN clients c  ON c.id = p.client_id
             WHERE s.user_id = ?
             ORDER BY s.scheduled_at',
            [$userId]
        )->fetchAll();
    }

    public static function find($userId, $id)
    {
        $seance = Database::run(
            'SELECT s.*, p.title AS project_title, c.first_name, c.last_name
             FROM sessions s
             JOIN projects p ON p.id = s.project_id
             JOIN clients c  ON c.id = p.client_id
             WHERE s.id = ? AND s.user_id = ?',
            [$id, $userId]
        )->fetch();
        return $seance ?: null;
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['project_id', 'title', 'scheduled_at']);

        // Le projet cible doit appartenir au tenant.
        if (!Project::exists($userId, (int) $data['project_id'])) {
            throw new HttpException('Le projet indique est introuvable', 422);
        }

        $values = self::champs($data);
        $values['user_id'] = $userId;

        Database::run(
            'INSERT INTO sessions (user_id, project_id, title, scheduled_at, status, notes)
             VALUES (:user_id, :project_id, :title, :scheduled_at, :status, :notes)',
            $values
        );

        return self::find($userId, (int) Database::connection()->lastInsertId());
    }

    public static function update($userId, $id, $data)
    {
        Validator::required($data, ['project_id', 'title', 'scheduled_at']);

        if (!Project::exists($userId, (int) $data['project_id'])) {
            throw new HttpException('Le projet indique est introuvable', 422);
        }

        $values = self::champs($data);
        $values['id'] = $id;
        $values['user_id'] = $userId;

        Database::run(
            'UPDATE sessions SET project_id = :project_id, title = :title,
                    scheduled_at = :scheduled_at, status = :status, notes = :notes
             WHERE id = :id AND user_id = :user_id',
            $values
        );

        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    private static function champs($data)
    {
        return [
            'project_id'   => (int) (isset($data['project_id']) ? $data['project_id'] : 0),
            'title'        => isset($data['title']) ? $data['title'] : '',
            'scheduled_at' => isset($data['scheduled_at']) ? $data['scheduled_at'] : null,
            'status'       => isset($data['status']) ? $data['status'] : 'planifiee',
            'notes'        => isset($data['notes']) ? $data['notes'] : null,
        ];
    }
}
