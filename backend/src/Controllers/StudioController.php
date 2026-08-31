<?php

// Studio du tenant : lecture et mise à jour.
class StudioController
{
    public static function show()
    {
        return Studio::forUser(Auth::userId());
    }

    // Mise à jour réservée aux administrateurs du studio.
    public static function update()
    {
        if (Auth::role() !== 'admin') {
            throw new HttpException('Seul un administrateur peut modifier les parametres du studio', 403);
        }
        return Studio::update(Auth::userId(), Request::body());
    }
}
