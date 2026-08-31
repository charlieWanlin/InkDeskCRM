<?php

// Authentification par JWT rangé dans un cookie httpOnly.
// Le navigateur renvoie ce cookie à chaque requête, et le JavaScript ne peut
// pas le lire : le jeton est donc protege contre le vol par injection (XSS).
class Auth
{
    const COOKIE = 'token';

    // Contenu du jeton pour la requete en cours : verifie une seule fois puis memorise.
    // false = pas encore verifie · null = pas de jeton valide · array = contenu du jeton.
    /** @var array<string,mixed>|null|false */
    private static $payload = false;

    // --- Reglages (lus dans .env) ---

    private static function secret()
    {
        return Env::get('JWT_SECRET', 'tatooshop-cle-a-changer-en-production');
    }

    private static function duration()
    {
        return (int) Env::get('JWT_DUREE', '86400'); // 24 h par defaut
    }

    // --- Connexion / deconnexion ---

    // Verifie l'email + mot de passe, signe un jeton et le pose dans le cookie.
    public static function login($email, $password)
    {
        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new HttpException('Email ou mot de passe incorrect', 401);
        }

        $token = Jwt::encode([
            'sub'  => (int) $user['id'],
            'name' => $user['name'],
            'role' => $user['role'],
            'exp'  => time() + self::duration(),
        ], self::secret());

        self::setCookie($token, time() + self::duration());
        return ['user' => self::publicUser($user)];
    }

    // Un cookie deja expire : le navigateur le supprime.
    public static function logout()
    {
        self::setCookie('', time() - 3600);
        return ['ok' => true];
    }

    // --- Lecture du jeton ---

    // Contenu du jeton (sub, name, role) s'il est present et valide, sinon null.
    /** @return array<string,mixed>|null */
    public static function check()
    {
        if (self::$payload !== false) {
            return self::$payload;
        }
        $token = self::readToken();
        self::$payload = $token ? Jwt::decode($token, self::secret()) : null;
        return self::$payload;
    }

    // Garde d'entree : coupe la requete avec un 401 si le jeton est absent/invalide.
    public static function requireToken()
    {
        if (self::check() === null) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Authentification requise']);
            exit;
        }
    }

    // Identifiant de l'utilisateur connecte : cle de l'isolation par studio.
    public static function userId()
    {
        $payload = self::check();
        if (!$payload) {
            throw new HttpException('Authentification requise', 401);
        }
        return (int) $payload['sub'];
    }

    // Role de l'utilisateur connecte ('admin' ou 'artiste').
    public static function role()
    {
        $payload = self::check();
        return $payload ? $payload['role'] : 'artiste';
    }

    // Identite renvoyee par GET /me (l'essentiel, sans les champs techniques du jeton).
    public static function currentUser()
    {
        $payload = self::check();
        if (!$payload) {
            throw new HttpException('Authentification requise', 401);
        }
        return [
            'id'   => (int) $payload['sub'],
            'name' => $payload['name'],
            'role' => $payload['role'],
        ];
    }

    // --- Cookie ---

    private static function setCookie($token, $expires)
    {
        setcookie(self::COOKIE, $token, [
            'expires'  => $expires,
            'path'     => '/',
            'httponly' => true,   // invisible au JavaScript (anti-XSS)
            'samesite' => 'Lax',
            // 'secure' => true,  // a activer derriere HTTPS
        ]);
    }

    // Jeton pris dans le cookie ; a defaut, dans l'en-tete Authorization: Bearer (tests curl/Postman).
    private static function readToken()
    {
        if (!empty($_COOKIE[self::COOKIE])) {
            return $_COOKIE[self::COOKIE];
        }
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
            return $m[1];
        }
        return null;
    }

    // Utilisateur expose au client : jamais le hash du mot de passe.
    public static function publicUser($user)
    {
        return [
            'id'    => (int) $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ];
    }
}
