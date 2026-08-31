<h1 align="center">InkDesk Software</h1>

<p align="center">
  Le logiciel de gestion des studios de tatouage.
</p>

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8-777BB4?style=flat-square&logo=php&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-5.7-4479A1?style=flat-square&logo=mysql&logoColor=white">
</p>

---

## À propos

Un tatoueur indépendant travaille aujourd'hui avec un carnet, un agenda papier et des
notes de téléphone. Les informations d'un même client se retrouvent éparpillées entre
trois supports, et rien ne relie un rendez-vous au devis qui lui correspond.

**InkDesk** est un CRM — un logiciel de gestion de la relation client — pensé pour ce
métier. L'artiste y retrouve la fiche de chaque client, les projets de tatouage en cours
avec leurs séances, l'agenda des rendez-vous, ainsi que les devis et les factures qui en
découlent. Le tout dans une seule application web, accessible depuis un ordinateur comme
depuis un téléphone.

Chaque artiste dispose de son propre compte et ne voit que ses propres données.

## Fonctionnalités

- **Clients** — fiches détaillées, recherche et filtres
- **Projets** — suivi d'un tatouage et de ses séances
- **Rendez-vous** — agenda des séances à venir et passées
- **Devis et factures** — lignes, totaux, conversion d'un devis en facture
- **Flashs** — catalogue de modèles avec envoi d'images
- **Équipe** — gestion des membres du studio et de leurs rôles

## Technologies

**Angular 22** · TypeScript · Tailwind CSS<br>
**PHP 8** sans framework · MySQL

---

## Installation

### Prérequis

- **PHP 8** et **MySQL 5.7** — le plus simple est d'installer [MAMP](https://www.mamp.info)
- **Node.js 20** ou supérieur

### 1 · Récupérer le projet

```bash
git clone https://github.com/charlieWanlin/inkdesk_software.git
cd inkdesk_software
```

### 2 · Créer la base de données

```bash
mysql -u root -p -e "CREATE DATABASE crm_tatooshop CHARACTER SET utf8mb4;"
mysql -u root -p crm_tatooshop < backend/database/schema.sql
mysql -u root -p crm_tatooshop < backend/database/seed.sql
```

> Avec MAMP, MySQL écoute sur le port `8889` : ajoutez `-h 127.0.0.1 -P 8889`
> et utilisez le client `/Applications/MAMP/Library/bin/mysql`.

### 3 · Configurer l'API

Créez le fichier `backend/.env` :

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=crm_tatooshop
DB_USER=votre_utilisateur
DB_PASS=votre_mot_de_passe

JWT_SECRET=une-longue-chaine-aleatoire
JWT_DUREE=86400
```

> Pour générer la clé : `openssl rand -hex 32`.
> Ce fichier contient vos identifiants, il n'est jamais publié sur GitHub.

### 4 · Lancer l'API

```bash
php -S localhost:8888 -t backend/public
```

### 5 · Lancer l'application

Dans un second terminal :

```bash
cd frontend
npm install
npm start
```

L'application est disponible sur **http://localhost:4200**.

### 6 · Créer son mot de passe

Générez l'empreinte de votre mot de passe :

```bash
php -r 'echo password_hash("le-mot-de-passe-de-votre-choix", PASSWORD_BCRYPT), "\n";'
```

Puis enregistrez-la pour le compte administrateur :

```sql
UPDATE users SET password_hash = 'LE_RESULTAT_DE_LA_COMMANDE'
WHERE email = 'admin@tatooshop.test';
```

Vous pouvez maintenant vous connecter.

---

<p align="center">
  <sub>
    Développé par <strong>Charlie Wanlin</strong> — projet réalisé dans le cadre du titre
    professionnel Développeur Web &amp; Web Mobile.
  </sub>
</p>
