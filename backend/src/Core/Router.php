<?php

// Routeur : enregistre les routes (méthode + chemin + handler) et exécute celle qui correspond.
// Le retour du handler est encodé en JSON.
class Router
{
    private static $routes = [];

    public static function add($methode, $chemin, $action)
    {
        self::$routes[] = ['methode' => $methode, 'chemin' => $chemin, 'action' => $action];
    }

    // Raccourcis par verbe HTTP.
    public static function get($chemin, $action)    { self::add('GET', $chemin, $action); }
    public static function post($chemin, $action)   { self::add('POST', $chemin, $action); }
    public static function put($chemin, $action)    { self::add('PUT', $chemin, $action); }
    public static function patch($chemin, $action)  { self::add('PATCH', $chemin, $action); }
    public static function delete($chemin, $action) { self::add('DELETE', $chemin, $action); }

    // Trouve la route correspondante, l'exécute, renvoie le résultat en JSON.
    public static function run()
    {
        header('Content-Type: application/json');

        $methode = $_SERVER['REQUEST_METHOD'];
        $chemin = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        foreach (self::$routes as $route) {
            if ($route['methode'] !== $methode) {
                continue;
            }

            // Les segments {param} deviennent des groupes capturants.
            $pattern = '#^' . preg_replace('#\{\w+\}#', '([^/]+)', $route['chemin']) . '$#';

            if (preg_match($pattern, $chemin, $params)) {
                array_shift($params);

                try {
                    echo json_encode(call_user_func_array($route['action'], $params));
                } catch (HttpException $e) {
                    http_response_code($e->status());
                    echo json_encode(['error' => $e->getMessage()]);
                } catch (Throwable $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erreur serveur', 'detail' => $e->getMessage()]);
                }
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Route introuvable']);
    }
}
