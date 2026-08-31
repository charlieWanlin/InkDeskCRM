<?php

// Équipe : liste, création et suppression des comptes.
class UserController
{
    public static function index()
    {
        return User::all();
    }

    // POST /users : création réservée aux administrateurs.
    public static function store()
    {
        if (Auth::role() !== 'admin') {
            throw new HttpException('Seul un administrateur peut inviter un membre', 403);
        }
        return User::create(Request::body());
    }

    // DELETE /users/{id} : suppression encadrée par les règles admin.
    public static function destroy($id)
    {
        User::delete($id, Auth::userId(), Auth::role());
        return ['deleted' => true];
    }
}
