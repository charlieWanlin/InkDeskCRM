<?php

// Profil de l'utilisateur connecté : lecture et mise à jour.
class ProfileController
{
    public static function show()
    {
        $profil = User::profile(Auth::userId());
        if (!$profil) {
            throw new HttpException('Utilisateur introuvable', 404);
        }
        return $profil;
    }

    public static function update()
    {
        return User::updateProfile(Auth::userId(), Request::body());
    }
}
