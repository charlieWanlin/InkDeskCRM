<?php

// Table "photos" : images rattachees a un projet ou a une seance.
class Photo
{
    public static function byProject($userId, $projectId)
    {
        return Database::run(
            'SELECT * FROM photos WHERE user_id = ? AND project_id = ? ORDER BY id',
            [$userId, $projectId]
        )->fetchAll();
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['project_id', 'url']);

        // Le projet doit appartenir au tenant.
        if (!Project::exists($userId, (int) $data['project_id'])) {
            throw new HttpException('Le projet indique est introuvable', 422);
        }

        Database::run(
            'INSERT INTO photos (user_id, project_id, session_id, url, caption)
             VALUES (:user_id, :project_id, :session_id, :url, :caption)',
            [
                'user_id'    => $userId,
                'project_id' => (int) $data['project_id'],
                'session_id' => !empty($data['session_id']) ? (int) $data['session_id'] : null,
                'url'        => $data['url'],
                'caption'    => isset($data['caption']) ? $data['caption'] : null,
            ]
        );

        $photo = Database::run('SELECT * FROM photos WHERE id = ?', [(int) Database::connection()->lastInsertId()])->fetch();
        return $photo ?: null;
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM photos WHERE id = ? AND user_id = ?', [$id, $userId]);
    }
}
