<?php

// Photos de projet (multi-tenant) : ajout et suppression.
class PhotoController
{
    // GET /projects/{id}/photos
    public static function index($projectId)
    {
        return Photo::byProject(Auth::userId(), $projectId);
    }

    // POST /photos  { project_id, url, session_id?, caption? }
    public static function store()
    {
        return Photo::create(Auth::userId(), Request::body());
    }

    public static function destroy($id)
    {
        Photo::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }
}
