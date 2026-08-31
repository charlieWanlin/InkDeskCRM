<?php

// Lecture de la requête entrante (corps JSON, paramètres d'URL).
class Request
{
    // Corps JSON de la requête décodé en tableau.
    public static function body()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data === null) {
            return [];
        }
        return $data;
    }

    // Paramètre de query string, ou $defaut si absent.
    public static function query($cle = null, $defaut = null)
    {
        if ($cle === null) {
            return $_GET;
        }
        if (isset($_GET[$cle])) {
            return $_GET[$cle];
        }
        return $defaut;
    }
}
