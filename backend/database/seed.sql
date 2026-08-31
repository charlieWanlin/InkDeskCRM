-- =====================================================================
-- Données de démonstration — CRM Tatooshop
-- À exécuter APRÈS schema.sql (qui recrée les tables vides).
-- Comptes de test : admin@tatooshop.test / admin123  (Emma, role admin)
--                   camille@tatooshop.test / admin123 (Camille, role artiste)
-- =====================================================================

USE crm_tatooshop;

-- Artistes du studio (multi-tenant : chacun possède ses propres données).
INSERT INTO users (id, name, email, password_hash, role, phone, bio) VALUES
  (1, 'Emma Clément', 'admin@tatooshop.test', '$2y$12$8QJ./Vdeuqb9eiWWzvLVduMq4wswGQEuSvzfnp4lHm4QAVEqCmceK', 'admin',
     '06 12 34 56 78', 'Tatoueuse fine line et ornemental. Emma accompagne chaque client avec un suivi clair, des devis propres et une ambiance douce au studio.'),
  (3, 'Camille Roy', 'camille@tatooshop.test', '$2y$12$8QJ./Vdeuqb9eiWWzvLVduMq4wswGQEuSvzfnp4lHm4QAVEqCmceK', 'artiste',
     '06 66 77 88 99', NULL);

-- Studios : une ligne par artiste. Sans elle, Studio::forUser() en crée
-- une automatiquement nommee "Mon studio".
INSERT INTO studios (user_id, name, subtitle, email, phone, address, siret, tva_mention,
                     quote_prefix, invoice_prefix, payment_terms, deposit_terms, notify_rdv, notify_invoices) VALUES
  (1, 'L''encre de Lune', 'LadyMoon', 'contact@ladymoonshop.fr', '04 78 00 00 00',
   '12 rue de la Lune, 69001 Lyon', '912 345 678 00014', 'TVA non applicable, art. 293 B du CGI',
   'DEV', 'FAC', 'Paiement comptant à réception', '30 % à la réservation', 1, 1),
  (3, 'L''encre de Lune', NULL, NULL, NULL, NULL, NULL, NULL,
   'DEV', 'FAC', NULL, NULL, 1, 1);

-- Clients.
INSERT INTO clients (id, user_id, first_name, last_name, email, phone, style, status, created_at) VALUES
  (1,  1, 'Léa',     'Martin',   'lea.martin@example.com',     '0612345678', 'Blackwork',  'actif',    '2026-05-02 10:00:00'),
  (2,  1, 'Hugo',    'Bernard',  'hugo.bernard@example.com',   '0678901234', 'Réalisme',   'actif',    '2026-05-10 10:00:00'),
  (3,  1, 'Camille', 'Petit',    'camille.petit@example.com',  '0699887766', 'Fine line',  'actif',    '2026-06-01 10:00:00'),
  (4,  1, 'Sarah',   'Dubois',   'sarah.dubois@example.com',   '0611223344', 'Blackwork',  'actif',    '2026-06-15 10:00:00'),
  (5,  1, 'Thomas',  'Leroy',    'thomas.leroy@example.com',   '0623456789', 'Réalisme',   'actif',    '2026-06-20 10:00:00'),
  (6,  1, 'Emma',    'Moreau',   'emma.moreau@example.com',    '0634567890', 'Fine line',  'prospect', '2026-07-01 10:00:00'),
  (7,  1, 'Lucas',   'Girard',   'lucas.girard@example.com',   '0645678901', 'Old school', 'actif',    '2026-07-05 10:00:00'),
  (8,  1, 'Chloé',   'Roux',     'chloe.roux@example.com',     '0656789012', 'Ornemental', 'actif',    '2026-07-08 10:00:00'),
  (9,  1, 'Nathan',  'Fournier', 'nathan.fournier@example.com','0667890123', 'Lettrage',   'prospect', '2026-07-12 10:00:00'),
  (10, 1, 'Manon',   'Lambert',  'manon.lambert@example.com',  '0678901234', 'Blackwork',  'actif',    '2026-07-15 10:00:00'),
  (11, 1, 'Jules',   'Bonnet',   'jules.bonnet@example.com',   '0689012345', 'Fine line',  'inactif',  '2026-07-18 10:00:00'),
  (12, 1, 'Inès',    'Faure',    'ines.faure@example.com',     '0690123456', 'Réalisme',   'actif',    '2026-07-20 10:00:00');

-- Flashs (catalogue).
INSERT INTO flashs (id, user_id, name, image, price, size_cm, placement, style, status) VALUES
  (1, 1, 'Rose',     'assets/img/flashs/rose.png',     180, 12, 'avant-bras', 'Fine line',  'disponible'),
  (2, 1, 'Fleurs',   'assets/img/flashs/fleurs.png',   200, 15, 'dos',        'Fine line',  'disponible'),
  (3, 1, 'Épée',     'assets/img/flashs/sword.png',     160, 12, 'bras',       'Old school', 'disponible'),
  (4, 1, 'Oiseau',   'assets/img/flashs/oiseau.png',   130,  9, 'poignet',    'Fine line',  'reserve'),
  (5, 1, 'Renard',   'assets/img/flashs/fox.png',      174, 11, 'mollet',     'Blackwork',  'reserve'),
  (6, 1, 'Insectes', 'assets/img/flashs/insectes.png', 150, 10, 'dos',        'Ornemental', 'vendu');

-- Projets (tatouages en cours / terminés).
INSERT INTO projects (id, user_id, client_id, title, style, zone, status, amount, planned_sessions, created_at) VALUES
  (1, 1, 1, 'Manchette florale',    'Blackwork', 'Avant-bras', 'en_cours',   900,  5, '2026-05-20 10:00:00'),
  (2, 1, 2, 'Portrait réaliste',    'Réalisme',  'Mollet',     'en_cours',   1320, 6, '2026-04-15 10:00:00'),
  (3, 1, 3, 'Hirondelle fine line', 'Fine line', 'Poignet',    'en_attente', 420,  2, '2026-07-01 10:00:00'),
  (4, 1, 1, 'Retouche manchette',   'Blackwork', 'Avant-bras', 'en_attente', 120,  1, '2026-07-05 10:00:00'),
  (5, 1, 3, 'Mini symbole',         'Fine line', 'Cheville',   'termine',    180,  1, '2026-03-10 10:00:00');

-- Séances (= rendez-vous, affichés dans le calendrier).
INSERT INTO sessions (user_id, project_id, title, scheduled_at, status, notes) VALUES
  (1, 1, 'Séance 1 — Lignage',      '2026-06-02 14:00:00', 'realisee',  'Contours posés.'),
  (1, 1, 'Séance 2 — Remplissage',  '2026-06-18 14:00:00', 'realisee',  'Ombrage partie basse.'),
  (1, 1, 'Séance 3 — Ombrage',      '2026-07-09 15:00:00', 'realisee',  ''),
  (1, 1, 'Séance 4 — Détails',      '2026-08-06 14:00:00', 'planifiee', ''),
  (1, 2, 'Séance 1 — Esquisse',     '2026-05-10 10:00:00', 'realisee',  ''),
  (1, 2, 'Séance 2 — Lignage',      '2026-05-30 10:00:00', 'realisee',  ''),
  (1, 2, 'Séance 3 — Ombrage',      '2026-06-20 10:00:00', 'realisee',  ''),
  (1, 2, 'Séance 4 — Détails',      '2026-07-16 11:00:00', 'realisee',  ''),
  (1, 2, 'Séance 5 — Contrastes',   '2026-08-05 10:00:00', 'planifiee', ''),
  (1, 5, 'Séance unique',           '2026-03-22 16:00:00', 'realisee',  'Terminé en une séance.');

-- Photos de référence.
INSERT INTO photos (user_id, project_id, session_id, url, caption) VALUES
  (1, 1, NULL, 'assets/img/flashs/rose.png',   'Projet de référence'),
  (1, 2, NULL, 'assets/img/flashs/fox.png',    'Projet de référence'),
  (1, 3, NULL, 'assets/img/flashs/oiseau.png', 'Projet de référence'),
  (1, 5, NULL, 'assets/img/flashs/insectes.png','Résultat final');

-- Devis.
INSERT INTO quotes (id, user_id, client_id, project_id, number, status, total_ht, total_tva, total_ttc, valid_until, created_at) VALUES
  (1, 1, 1, 1, 'DEV-2026-001', 'accepte',   900, 0, 900, '2026-06-20', '2026-05-20 10:00:00'),
  (2, 1, 2, 2, 'DEV-2026-002', 'envoye',    480, 0, 480, '2026-08-15', '2026-07-15 10:00:00'),
  (3, 1, 3, 3, 'DEV-2026-003', 'brouillon', 420, 0, 420, NULL,         '2026-07-18 10:00:00');

INSERT INTO quote_items (quote_id, label, qty, unit_price, tva_rate) VALUES
  (1, 'Manchette florale — forfait', 1, 900, 0),
  (2, 'Portrait réaliste — séance',  1, 480, 0),
  (3, 'Hirondelle fine line',        1, 420, 0);

-- Factures.
INSERT INTO invoices (id, user_id, client_id, quote_id, project_id, number, status, total_ht, total_tva, total_ttc, issued_at, due_at, paid_at, created_at) VALUES
  (1, 1, 1, 1, 1, 'FAC-2026-001', 'payee', 900, 0, 900, '2026-06-28', '2026-07-28', '2026-07-02', '2026-06-28 10:00:00'),
  (2, 1, 3, NULL, 5, 'FAC-2026-002', 'payee', 180, 0, 180, '2026-03-25', '2026-04-25', '2026-03-26', '2026-03-25 10:00:00'),
  (3, 1, 2, NULL, 2, 'FAC-2026-003', 'emise', 480, 0, 480, '2026-07-20', '2026-08-20', NULL, '2026-07-20 10:00:00');

INSERT INTO invoice_items (invoice_id, label, qty, unit_price, tva_rate) VALUES
  (1, 'Manchette florale — forfait', 1, 900, 0),
  (2, 'Mini symbole',                1, 180, 0),
  (3, 'Portrait réaliste — séance',  1, 480, 0);

