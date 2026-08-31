<?php

// Lecture du fichier .env (chargé une fois, gardé en mémoire).
class Env
{
    private static $vars = null;

    // Charge le fichier .env en mémoire (une seule fois).
    public static function load($chemin)
    {
        self::$vars = [];
        if (!is_file($chemin)) {
            return;
        }
        foreach (file($chemin, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ligne) {
            $ligne = trim($ligne);
            if ($ligne === '' || $ligne[0] === '#' || strpos($ligne, '=') === false) {
                continue;
            }
            list($cle, $valeur) = explode('=', $ligne, 2);
            self::$vars[trim($cle)] = trim($valeur);
        }
    }

    // Donne la valeur d'un réglage, ou $defaut si absent.
    public static function get($cle, $defaut = null)
    {
        if (self::$vars === null) {
            self::load(dirname(__DIR__, 2) . '/.env');
        }
        if (isset(self::$vars[$cle])) {
            return self::$vars[$cle];
        }
        return $defaut;
    }
}
