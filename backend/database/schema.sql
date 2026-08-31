-- =====================================================================
-- Schéma de base de données — CRM Salon de Tatouage
-- Moteur : MySQL 8 (MAMP). Encodage utf8mb4.
--
-- Multi-tenant : chaque USER (artiste) possède ses données. Les tables
-- racines portent un user_id ; l'API filtre dessus.
--
-- Domaine métier :
--   users → clients → projects → sessions (= séances = rendez-vous)
--                              → photos
--   clients → quotes (+ quote_items) → invoices (+ invoice_items)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS crm_tatooshop
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE crm_tatooshop;

-- On repart d'une base propre (ordre inverse des dépendances).
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS quote_items;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS flashs;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS studios;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Utilisateurs (comptes qui se connectent = les "tenants").
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin', 'artiste') NOT NULL DEFAULT 'artiste',
    phone         VARCHAR(50)  DEFAULT NULL,
    bio           TEXT         DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Studio de l'artiste (1 par utilisateur) : identité + réglages facturation.
-- Sert au nom affiché partout (sidebar, footer, en-têtes devis/factures).
-- ---------------------------------------------------------------------
CREATE TABLE studios (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    subtitle        VARCHAR(150) DEFAULT NULL,
    email           VARCHAR(180) DEFAULT NULL,
    phone           VARCHAR(50)  DEFAULT NULL,
    address         VARCHAR(255) DEFAULT NULL,
    siret           VARCHAR(50)  DEFAULT NULL,
    tva_mention     VARCHAR(255) DEFAULT NULL,
    quote_prefix    VARCHAR(10)  NOT NULL DEFAULT 'DEV',
    invoice_prefix  VARCHAR(10)  NOT NULL DEFAULT 'FAC',
    payment_terms   VARCHAR(255) DEFAULT NULL,
    deposit_terms   VARCHAR(255) DEFAULT NULL,
    notify_rdv      TINYINT(1) NOT NULL DEFAULT 1,
    notify_invoices TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_studios_user (user_id),
    CONSTRAINT fk_studios_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Clients du salon (appartiennent à un artiste).
-- ---------------------------------------------------------------------
CREATE TABLE clients (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(180) DEFAULT NULL,
    phone        VARCHAR(30) DEFAULT NULL,
    birthdate    DATE DEFAULT NULL,
    address      VARCHAR(255) DEFAULT NULL,
    allergies    TEXT DEFAULT NULL,
    health_notes TEXT DEFAULT NULL,
    notes        TEXT DEFAULT NULL,
    style        VARCHAR(60) DEFAULT NULL,
    status       ENUM('prospect', 'actif', 'inactif') NOT NULL DEFAULT 'prospect',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_clients_user (user_id),
    KEY idx_clients_last_name (last_name),
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Catalogue des modèles "flash" prêts à tatouer.
-- ---------------------------------------------------------------------
CREATE TABLE flashs (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    name       VARCHAR(120) NOT NULL,
    image      VARCHAR(255) DEFAULT NULL,
    price      DECIMAL(8, 2) NOT NULL DEFAULT 0,
    size_cm    INT UNSIGNED DEFAULT NULL,
    placement  VARCHAR(80) DEFAULT NULL,
    style      VARCHAR(60) DEFAULT NULL,
    status     ENUM('disponible', 'reserve', 'vendu') NOT NULL DEFAULT 'disponible',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_flashs_user (user_id),
    KEY idx_flashs_status (status),
    CONSTRAINT fk_flashs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Projets (un tatouage = un projet, réalisé en une ou plusieurs séances).
-- Peut naître d'un flash (flash_id).
-- ---------------------------------------------------------------------
CREATE TABLE projects (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          INT UNSIGNED NOT NULL,
    client_id        INT UNSIGNED NOT NULL,
    flash_id         INT UNSIGNED DEFAULT NULL,
    title            VARCHAR(150) NOT NULL,
    style            VARCHAR(60) DEFAULT NULL,
    zone             VARCHAR(80) DEFAULT NULL,
    status           ENUM('en_attente', 'en_cours', 'termine') NOT NULL DEFAULT 'en_attente',
    amount           DECIMAL(10, 2) NOT NULL DEFAULT 0,
    planned_sessions INT UNSIGNED NOT NULL DEFAULT 1,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_projects_user (user_id),
    KEY idx_projects_client (client_id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_flash FOREIGN KEY (flash_id)
        REFERENCES flashs (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Séances = les rendez-vous. Chaque séance appartient à un projet.
-- C'est ce que le calendrier affiche (scheduled_at = date + heure).
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    project_id   INT UNSIGNED NOT NULL,
    title        VARCHAR(150) NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status       ENUM('planifiee', 'realisee', 'annulee') NOT NULL DEFAULT 'planifiee',
    notes        TEXT DEFAULT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_project (project_id),
    KEY idx_sessions_scheduled (scheduled_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Photos d'un projet (référence) ou d'une séance (session_id renseigné).
-- ---------------------------------------------------------------------
CREATE TABLE photos (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED DEFAULT NULL,
    url        VARCHAR(500) NOT NULL,
    caption    VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_photos_user (user_id),
    KEY idx_photos_project (project_id),
    CONSTRAINT fk_photos_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_session FOREIGN KEY (session_id)
        REFERENCES sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Devis (en-tête). Peut être rattaché à un projet.
-- ---------------------------------------------------------------------
CREATE TABLE quotes (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    client_id   INT UNSIGNED NOT NULL,
    project_id  INT UNSIGNED DEFAULT NULL,
    number      VARCHAR(30) NOT NULL,
    status      ENUM('brouillon', 'envoye', 'accepte', 'refuse') NOT NULL DEFAULT 'brouillon',
    total_ht    DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_tva   DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_ttc   DECIMAL(10, 2) NOT NULL DEFAULT 0,
    valid_until DATE DEFAULT NULL,
    notes       TEXT DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quotes_user_number (user_id, number),
    KEY idx_quotes_user (user_id),
    KEY idx_quotes_client (client_id),
    CONSTRAINT fk_quotes_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_quotes_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_quotes_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quote_items (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    quote_id   INT UNSIGNED NOT NULL,
    label      VARCHAR(200) NOT NULL,
    qty        DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tva_rate   DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    PRIMARY KEY (id),
    KEY idx_quote_items_quote (quote_id),
    CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id)
        REFERENCES quotes (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Factures (en-tête). Issue d'un devis (quote_id) ou créée seule.
-- ---------------------------------------------------------------------
CREATE TABLE invoices (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    client_id  INT UNSIGNED NOT NULL,
    quote_id   INT UNSIGNED DEFAULT NULL,
    project_id INT UNSIGNED DEFAULT NULL,
    number     VARCHAR(30) NOT NULL,
    status     ENUM('emise', 'payee', 'annulee') NOT NULL DEFAULT 'emise',
    total_ht   DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_tva  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_ttc  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    issued_at  DATE NOT NULL,
    due_at     DATE DEFAULT NULL,
    paid_at    DATE DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_user_number (user_id, number),
    KEY idx_invoices_user (user_id),
    KEY idx_invoices_client (client_id),
    KEY idx_invoices_quote (quote_id),
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_quote FOREIGN KEY (quote_id)
        REFERENCES quotes (id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE invoice_items (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    invoice_id INT UNSIGNED NOT NULL,
    label      VARCHAR(200) NOT NULL,
    qty        DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tva_rate   DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    PRIMARY KEY (id),
    KEY idx_invoice_items_invoice (invoice_id),
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
