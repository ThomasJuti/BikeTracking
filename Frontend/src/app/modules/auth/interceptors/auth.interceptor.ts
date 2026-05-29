import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';
import { MaintenanceNotificationsService } from '../../motocicletas/services/maintenance-notifications.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notifications = inject(MaintenanceNotificationsService);
  const token = auth.token();

  const authedReq =
    token && req.url.includes(`${environment.apiUrl}/`)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes(`${environment.apiUrl}/auth/login`) && !req.url.includes(`${environment.apiUrl}/auth/register`)) {
        notifications.clear();
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
