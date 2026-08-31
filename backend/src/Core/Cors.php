<?php

// CORS : autorise le front Angular à appeler l'API.
// Origine précise obligatoire (jamais "*") car les requêtes envoient un cookie (credentials).
class Cors
{
    public static function apply()
    {
        header('Access-Control-Allow-Origin: http://localhost:4200');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

        // Preflight CORS.
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
