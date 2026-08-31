import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Cookie httpOnly transmis avec chaque requête ; une 401 hors login ferme la session.

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // On clone la requête pour inclure les cookies httpOnly avec chaque requête.
  req = req.clone({ withCredentials: true });

  return next(req).pipe(
    // catchError intercepte les erreurs HTTP pour gérer les réponses non autorisées (401).
    catchError((err: HttpErrorResponse) => {

      // Si la réponse est 401 (non autorisé) et que ce n'est pas une requête de login, on ferme la session.
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        auth.clearSession();
      }
      // On renvoie l'erreur pour que les autres gestionnaires puissent la traiter.
      return throwError(() => err);
    }),
  );
};
