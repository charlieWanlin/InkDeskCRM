<?php

// Séances/rendez-vous (multi-tenant) : CRUD REST pour le calendrier.
class SessionController
{
    public static function index()
    {
        return Session::all(Auth::userId());
    }

    public static function show($id)
    {
        return self::or404(Auth::userId(), $id);
    }

    public static function store()
    {
        return Session::create(Auth::userId(), Request::body());
    }

    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Session::update($userId, $id, Request::body());
    }

    public static function destroy($id)
    {
        Session::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    private static function or404($userId, $id)
    {
        $session = Session::find($userId, $id);
        if (!$session) {
            throw new HttpException('Rendez-vous introuvable', 404);
        }
        return $session;
    }
}
