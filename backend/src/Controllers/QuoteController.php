<?php

// Devis (multi-tenant) : CRUD REST.
class QuoteController
{
    public static function index()
    {
        return Quote::all(
            Auth::userId(),
            Request::query('search'),
            Request::query('status'),
            Request::query('sort')
        );
    }

    public static function show($id)
    {
        return self::or404(Auth::userId(), $id);
    }

    public static function store()
    {
        return Quote::create(Auth::userId(), Request::body());
    }

    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Quote::update($userId, $id, Request::body());
    }

    public static function destroy($id)
    {
        Quote::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    private static function or404($userId, $id)
    {
        $quote = Quote::find($userId, $id);
        if (!$quote) {
            throw new HttpException('Devis introuvable', 404);
        }
        return $quote;
    }
}
