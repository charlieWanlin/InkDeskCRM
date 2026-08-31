<?php

// Projets (multi-tenant) : CRUD REST avec séances et photos.
class ProjectController
{
    public static function index()
    {
        return Project::all(
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
        return Project::create(Auth::userId(), Request::body());
    }

    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Project::update($userId, $id, Request::body());
    }

    public static function destroy($id)
    {
        Project::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    private static function or404($userId, $id)
    {
        $project = Project::find($userId, $id);
        if (!$project) {
            throw new HttpException('Projet introuvable', 404);
        }
        return $project;
    }
}
