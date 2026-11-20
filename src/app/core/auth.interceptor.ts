import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const ANONYMOUS_AUTH = /\/auth\/(login|register|refresh|forgot-password|reset-password|confirm-email|resend-confirmation|logout|registration-roles)$/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const isApi = req.url.startsWith(environment.apiUrl);
  const anonymous = isApi && ANONYMOUS_AUTH.test(req.url);

  if (!isApi) {
    return next(req);
  }

  const auth = injector.get(AuthService);
  const withToken = (request: HttpRequest<unknown>) => {
    const token = auth.accessToken();
    return token && !anonymous ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  };

  return next(withToken(req)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !anonymous && auth.refreshToken()) {
        return from(auth.refresh()).pipe(
          switchMap((ok) => {
            if (ok) {
              return next(withToken(req));
            }
            auth.expire();
            return throwError(() => error);
          }),
        );
      }

      if (error.status === 401 && !anonymous) {
        auth.expire();
      }

      if (error.status === 403 && error.error?.data?.code === 'PasswordChangeRequired') {
        auth.markPasswordChangeRequired();
      }

      return throwError(() => error);
    }),
  );
};
