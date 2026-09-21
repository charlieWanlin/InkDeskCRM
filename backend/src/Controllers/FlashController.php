<?php

// Flashs (catalogue multi-tenant) : CRUD REST et import d'image.
class FlashController
{
    // GET /flashs?search=...&status=...&style=...&sort=...
    public static function index()
    {
        return Flash::all(
            Auth::userId(),
            Request::query('search'),
            Request::query('status'),
            Request::query('style'),
            Request::query('sort')
        );
    }

    public static function show($id)
    {
        return self::or404(Auth::userId(), $id);
    }

    public static function store()
    {
        return Flash::create(Auth::userId(), Request::body());
    }

    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Flash::update($userId, $id, Request::body());
    }

    public static function destroy($id)
    {
        Flash::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    // POST /flashs/upload : image PNG/JPEG et URL publique.
    public static function upload()
    {
        $file = isset($_FILES['image']) ? $_FILES['image'] : null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            throw new HttpException('Aucun fichier recu.', 422);
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new HttpException('Image trop lourde (5 Mo maximum).', 422);
        }

        // Type MIME réel vérifié, pas seulement l'extension annoncée.
        $extensions = ['image/png' => 'png', 'image/jpeg' => 'jpg'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!isset($extensions[$mime])) {
            throw new HttpException('Format non supporte : PNG ou JPEG uniquement.', 422);
        }

        $folder = __DIR__ . '/../../public/uploads/flashs';
        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }

        $name = 'flash_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'], "$folder/$name")) {
            throw new HttpException("Echec de l'enregistrement du fichier.", 500);
        }

        $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http';
        $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost:8000';
        $base = $scheme . '://' . $host;
        return ['url' => "$base/uploads/flashs/$name", 'path' => "/uploads/flashs/$name"];
    }

    private static function or404($userId, $id)
    {
        $flash = Flash::find($userId, $id);
        if (!$flash) {
            throw new HttpException('Flash introuvable', 404);
        }
        return $flash;
    }
}
