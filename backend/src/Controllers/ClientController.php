<?php

// Clients (multi-tenant) : CRUD REST.
// Tenant lu via Auth::userId() pour isoler les données.
class ClientController
{
    // GET /clients?search=...&status=...&style=...&sort=...
    public static function index()
    {
        return Client::all(
            Auth::userId(),
            Request::query('search'),
            Request::query('status'),
            Request::query('style'),
            Request::query('sort')
        );
    }

    // GET /clients/{id}
    public static function show($id)
    {
        return self::or404(Auth::userId(), $id);
    }

    // POST /clients
    public static function store()
    {
        return Client::create(Auth::userId(), Request::body());
    }

    // PUT /clients/{id}
    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Client::update($userId, $id, Request::body());
    }

    // DELETE /clients/{id}
    public static function destroy($id)
    {
        Client::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    // Client ou erreur 404.
    private static function or404($userId, $id)
    {
        $client = Client::find($userId, $id);
        if (!$client) {
            throw new HttpException('Client introuvable', 404);
        }
        return $client;
    }
}
