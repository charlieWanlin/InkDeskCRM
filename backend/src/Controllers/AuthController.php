<?php

// Authentification HTTP : connexion, session courante et déconnexion.
class AuthController
{
    // POST /auth/login : jeton en cookie httpOnly.
    public static function login()
    {
        $body = Request::body();
        $email = isset($body['email']) ? $body['email'] : '';
        $password = isset($body['password']) ? $body['password'] : '';
        return Auth::login($email, $password);
    }

    // GET /me : utilisateur connecté.
    public static function me()
    {
        return Auth::currentUser();
    }

    // POST /auth/logout : suppression du cookie.
    public static function logout()
    {
        return Auth::logout();
    }
}
