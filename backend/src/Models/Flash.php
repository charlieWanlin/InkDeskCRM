<?php

// Table "flashs" (catalogue de modeles, multi-tenant) : chaque requete filtre sur $userId.
// Requetes preparees : protection contre l'injection SQL.
class Flash
{
    public static function all($userId, $search = null, $status = null, $style = null, $sort = null)
    {
        $sql = 'SELECT * FROM flashs WHERE user_id = ?';
        $params = [$userId];

        if ($search) {
            $sql .= ' AND (name LIKE ? OR style LIKE ? OR placement LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($status) {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }
        if ($style) {
            $sql .= ' AND style = ?';
            $params[] = $style;
        }

        // Tri par liste blanche : aucune valeur recue n'est inseree directement dans ORDER BY.
        $orders = ['recent' => 'created_at DESC', 'prix_desc' => 'price DESC', 'prix_asc' => 'price ASC'];
        $sql .= ' ORDER BY ' . (($sort !== null && isset($orders[$sort])) ? $orders[$sort] : 'created_at DESC');

        return Database::run($sql, $params)->fetchAll();
    }

    public static function find($userId, $id)
    {
        $flash = Database::run('SELECT * FROM flashs WHERE id = ? AND user_id = ?', [$id, $userId])->fetch();
        return $flash ?: null;
    }

    public static function exists($userId, $id)
    {
        return (bool) Database::run('SELECT 1 FROM flashs WHERE id = ? AND user_id = ?', [$id, $userId])->fetchColumn();
    }

    public static function create($userId, $data)
    {
        Validator::required($data, ['name']);

        $values = self::champs($data);
        $values['user_id'] = $userId;

        Database::run(
            'INSERT INTO flashs (user_id, name, image, price, size_cm, placement, style, status)
             VALUES (:user_id, :name, :image, :price, :size_cm, :placement, :style, :status)',
            $values
        );

        return self::find($userId, (int) Database::connection()->lastInsertId());
    }

    public static function update($userId, $id, $data)
    {
        Validator::required($data, ['name']);

        $values = self::champs($data);
        $values['id'] = $id;
        $values['user_id'] = $userId;

        Database::run(
            'UPDATE flashs SET name = :name, image = :image, price = :price, size_cm = :size_cm,
                    placement = :placement, style = :style, status = :status
             WHERE id = :id AND user_id = :user_id',
            $values
        );

        return self::find($userId, $id);
    }

    public static function delete($userId, $id)
    {
        Database::run('DELETE FROM flashs WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    private static function champs($data)
    {
        return [
            'name'      => isset($data['name']) ? $data['name'] : '',
            'image'     => isset($data['image']) ? $data['image'] : null,
            'price'     => isset($data['price']) ? $data['price'] : 0,
            'size_cm'   => isset($data['size_cm']) ? $data['size_cm'] : null,
            'placement' => isset($data['placement']) ? $data['placement'] : null,
            'style'     => isset($data['style']) ? $data['style'] : null,
            'status'    => isset($data['status']) ? $data['status'] : 'disponible',
        ];
    }
}
