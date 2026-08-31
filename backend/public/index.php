<?php

// Front controller : inclusions, configuration, garde d'authentification, déclaration des routes.

// --- 1. Inclusion des fichiers  ---
$src = __DIR__ . '/../src';

// Core (HttpException en premier).
require $src . '/Core/HttpException.php';
require $src . '/Core/Env.php';
require $src . '/Core/Cors.php';
require $src . '/Core/Database.php';
require $src . '/Core/Request.php';
require $src . '/Core/Validator.php';
require $src . '/Core/Jwt.php';
require $src . '/Core/Auth.php';
require $src . '/Core/Router.php';

// Modèles.
require $src . '/Models/User.php';
require $src . '/Models/Studio.php';
require $src . '/Models/Client.php';
require $src . '/Models/Flash.php';
require $src . '/Models/Project.php';
require $src . '/Models/Session.php';
require $src . '/Models/Photo.php';
require $src . '/Models/Quote.php';
require $src . '/Models/Invoice.php';

// Contrôleurs.
require $src . '/Controllers/AuthController.php';
require $src . '/Controllers/ClientController.php';
require $src . '/Controllers/FlashController.php';
require $src . '/Controllers/ProjectController.php';
require $src . '/Controllers/SessionController.php';
require $src . '/Controllers/PhotoController.php';
require $src . '/Controllers/QuoteController.php';
require $src . '/Controllers/InvoiceController.php';
require $src . '/Controllers/StudioController.php';
require $src . '/Controllers/ProfileController.php';
require $src . '/Controllers/UserController.php';

// --- 2. Configuration + CORS ---
Env::load(__DIR__ . '/../.env');
Cors::apply();

// --- 3. Garde d'authentification ---
// Seules la racine et /auth/login|logout sont publiques.
$chemin = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


if (!in_array($chemin, ['/','/auth/login', '/auth/logout'], true)) {
    Auth::requireToken();
}

// --- 4. Routes ---


// Général
Router::get('/', function () { return ['name' => 'CRM Tatooshop API', 'status' => 'ok', ]; });

// 'password_hash' => password_hash('admin123', PASSWORD_BCRYPT) 
// cette ligne ci dessus m'a servi à générer le hash du mot de passe par défaut pour l'utilisateur admin.

// Authentification
Router::post('/auth/login', 'AuthController::login');
Router::post('/auth/logout', 'AuthController::logout');
Router::get('/me', 'AuthController::me');

// Studio (reglages, 1 par artiste)
Router::get('/studio', 'StudioController::show');
Router::put('/studio', 'StudioController::update');

// Profil de l'utilisateur connecte
Router::get('/profile', 'ProfileController::show');
Router::put('/profile', 'ProfileController::update');

// Equipe (comptes)
Router::get('/users', 'UserController::index');
Router::post('/users', 'UserController::store');
Router::delete('/users/{id}', 'UserController::destroy');

// Clients
Router::get('/clients', 'ClientController::index');
Router::get('/clients/{id}', 'ClientController::show');
Router::post('/clients', 'ClientController::store');
Router::put('/clients/{id}', 'ClientController::update');
Router::delete('/clients/{id}', 'ClientController::destroy');

// Projets
Router::get('/projects', 'ProjectController::index');
Router::get('/projects/{id}', 'ProjectController::show');
Router::post('/projects', 'ProjectController::store');
Router::put('/projects/{id}', 'ProjectController::update');
Router::delete('/projects/{id}', 'ProjectController::destroy');
Router::get('/projects/{id}/photos', 'PhotoController::index');

// Seances / rendez-vous
Router::get('/sessions', 'SessionController::index');
Router::get('/sessions/{id}', 'SessionController::show');
Router::post('/sessions', 'SessionController::store');
Router::put('/sessions/{id}', 'SessionController::update');
Router::delete('/sessions/{id}', 'SessionController::destroy');

// Photos
Router::post('/photos', 'PhotoController::store');
Router::delete('/photos/{id}', 'PhotoController::destroy');

// Devis
Router::get('/quotes', 'QuoteController::index');
Router::get('/quotes/{id}', 'QuoteController::show');
Router::post('/quotes', 'QuoteController::store');
Router::put('/quotes/{id}', 'QuoteController::update');
Router::delete('/quotes/{id}', 'QuoteController::destroy');

// Factures
Router::get('/invoices', 'InvoiceController::index');
Router::get('/invoices/{id}', 'InvoiceController::show');
Router::post('/invoices', 'InvoiceController::store');
Router::post('/invoices/from-quote/{quoteId}', 'InvoiceController::fromQuote');
Router::put('/invoices/{id}', 'InvoiceController::update');
Router::delete('/invoices/{id}', 'InvoiceController::destroy');

// Flash (catalogue)
Router::get('/flashs', 'FlashController::index');
Router::post('/flashs/upload', 'FlashController::upload');
Router::get('/flashs/{id}', 'FlashController::show');
Router::post('/flashs', 'FlashController::store');
Router::put('/flashs/{id}', 'FlashController::update');
Router::patch('/flashs/{id}', 'FlashController::update');
Router::delete('/flashs/{id}', 'FlashController::destroy');

Router::run();
