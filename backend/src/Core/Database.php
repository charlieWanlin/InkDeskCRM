<?php

// Connexion PDO à MySQL (ouverte une fois, réutilisée) et exécution de requêtes préparées.
class Database
{
    private static $pdo = null;

    public static function connection()
    {
        if (self::$pdo === null) {
            $host = Env::get('DB_HOST', '127.0.0.1');
            $port = Env::get('DB_PORT', '8889');
            $name = Env::get('DB_NAME', 'crm_tatooshop');
            $user = Env::get('DB_USER', 'root');
            $password = Env::get('DB_PASS', 'root');

            self::$pdo = new PDO(
                "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4",
                $user,
                $password,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        }
        return self::$pdo;
    }

    // Exécute une requête préparée : les valeurs passent par $params (protection contre l'injection SQL).
    public static function run($sql, $params = [])
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
