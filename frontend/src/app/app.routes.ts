import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [

// Routes publiques de l'application.
  {
    path: 'login',
    title: "Connexion — L'encre de Lune",
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },


  // Routes protégées nécessitant une authentification.
  
  {
    path: '',
    component: Layout,
    canActivate: [authGuard], // Protection des routes enfants par le guard d'authentification.
    // Définition des routes enfants accessibles uniquement après authentification.
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
      {
        path: 'dashboard',
        title: "Tableau de bord — L'encre de Lune",
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      // Gestion des routes clients.

      {
        path: 'clients', // Route pour la liste des clients.
        title: "Clients — L'encre de Lune", 
        loadComponent: () => import('./features/clients/clients').then((m) => m.Clients), // module for clients list
        // lazy loading pour que le module des clients soit chargé uniquement lorsque cette route est accédée.
      },
      {
        path: 'clients/:id',
        title: "Fiche client — L'encre de Lune",
        loadComponent: () => import('./features/clients/client-detail').then((m) => m.ClientDetail),
      },
      {
        path: 'rendez-vous',
        title: "Rendez-vous — L'encre de Lune",
        loadComponent: () => import('./features/rendez-vous/rendez-vous').then((m) => m.RendezVous),
      },
      {
        path: 'devis',
        title: "Devis — L'encre de Lune",
        loadComponent: () => import('./features/devis/devis').then((m) => m.Devis),
      },
      {
        path: 'devis/nouveau',
        title: "Nouveau devis — L'encre de Lune",
        loadComponent: () => import('./features/devis/devis-nouveau').then((m) => m.DevisNouveau),
      },
      {
        path: 'devis/:id',
        title: "Détail du devis — L'encre de Lune",
        loadComponent: () => import('./features/devis/devis-detail').then((m) => m.DevisDetail),
      },
      {
        path: 'factures',
        title: "Factures — L'encre de Lune",
        loadComponent: () => import('./features/factures/factures').then((m) => m.Factures),
      },
      {
        path: 'factures/nouveau',
        title: "Nouvelle facture — L'encre de Lune",
        loadComponent: () =>
          import('./features/factures/facture-nouveau').then((m) => m.FactureNouveau),
      },
      {
        path: 'factures/:id',
        title: "Détail de la facture — L'encre de Lune",
        loadComponent: () =>
          import('./features/factures/facture-detail').then((m) => m.FactureDetail),
      },
      {
        path: 'projets',
        title: "Projets — L'encre de Lune",
        loadComponent: () => import('./features/projets/projets').then((m) => m.Projets),
      },
      {
        path: 'projets/:id',
        title: "Détail du projet — L'encre de Lune",
        loadComponent: () => import('./features/projets/projet-detail').then((m) => m.ProjetDetail),
      },
      {
        path: 'flash',
        title: "Flashs — L'encre de Lune",
        loadComponent: () => import('./features/flash/flash').then((m) => m.FlashPage),
      },
      {
        path: 'parametres',
        title: "Paramètres — L'encre de Lune",
        loadComponent: () => import('./features/parametres/parametres').then((m) => m.Parametres),
      },
      {
        path: 'profil',
        title: "Profil — L'encre de Lune",
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
      {
        path: 'utilisateurs',
        title: "Utilisateurs — L'encre de Lune",
        loadComponent: () =>
          import('./features/utilisateurs/utilisateurs').then((m) => m.Utilisateurs),
      },
    ],
  },

  // Route de fallback pour rediriger les chemins non définis vers la page d'accueil.
  { path: '**', redirectTo: '' },
];
