<?php

// Table "users" : authentification, profil et equipe.
class User
{
    // Utilisateur par email, ou null.
    public static function findByEmail(string $email)
    {
        $user = Database::run('SELECT * FROM users WHERE email = ?', [$email])->fetch();
        return $user ?: null;
    }

    // Liste de l'equipe (sans mots de passe).
    public static function all()
    {
        return Database::run(
            'SELECT id, name, email, role, phone, created_at FROM users ORDER BY id'
        )->fetchAll();
    }

    // Profil public d'un utilisateur (sans hachage du mot de passe).
    public static function profile(int $id)
    {
        $user = Database::run(
            'SELECT id, name, email, role, phone, bio FROM users WHERE id = ?',
            [$id]
        )->fetch();
        return $user ?: null;
    }

    public static function updateProfile(int $id, array $data)
    {
        Validator::required($data, ['name', 'email']);

        Database::run(
            'UPDATE users SET name = :name, email = :email, phone = :phone, bio = :bio WHERE id = :id',
            [
                'name'  => $data['name'],
                'email' => $data['email'],
                'phone' => isset($data['phone']) ? $data['phone'] : null,
                'bio'   => isset($data['bio']) ? $data['bio'] : null,
                'id'    => $id,
            ]
        );

        return self::profile($id);
    }

    // Creation d'un membre de l'equipe.
    public static function create(array $data)
    {
        Validator::required($data, ['name', 'email', 'password']);

        // Unicite de l'email.
        if (self::findByEmail($data['email'])) {
            throw new HttpException('Cet e-mail est deja utilise', 422);
        }

        $role = (isset($data['role']) && $data['role'] === 'admin') ? 'admin' : 'artiste';

        Database::run(
            'INSERT INTO users (name, email, password_hash, role, phone)
             VALUES (:name, :email, :password_hash, :role, :phone)',
            [
                'name'          => $data['name'],
                'email'         => $data['email'],
                // Hachage du mot de passe (jamais stocke en clair).
                'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                'role'          => $role,
                'phone'         => isset($data['phone']) ? $data['phone'] : null,
            ]
        );

        return self::profile((int) Database::connection()->lastInsertId());
    }

    // Suppression d'un membre : admin requis, hors soi-meme et autres admins.
    public static function delete(int $id, int $currentUserId, string $currentRole)
    {
        if ($currentRole !== 'admin') {
            throw new HttpException('Seul un administrateur peut supprimer un membre', 403);
        }
        if ($id === $currentUserId) {
            throw new HttpException('Vous ne pouvez pas supprimer votre propre compte', 422);
        }
        $cible = Database::run('SELECT role FROM users WHERE id = ?', [$id])->fetch();
        if ($cible && $cible['role'] === 'admin') {
            throw new HttpException('Un compte administrateur ne peut pas etre supprime', 422);
        }
        Database::run('DELETE FROM users WHERE id = ?', [$id]);
    }
}
