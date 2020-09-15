import { Inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { OktaAuthService } from './okta-auth.service';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { OKTA_UNAUTHORIZED_URL } from '../../tokens/okta-unauthorized-url-token';

/**
 * This interceptor for preventing unauthorized access for protected endpoints
 */
@Injectable()
export class OktaAuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: OktaAuthService,
    private router: Router,
    @Inject(OKTA_UNAUTHORIZED_URL) private unauthorizedUrl: string
  ) {}

  /**
   * Put authorization token in every request. If token doesn't exist he will be redirected on the login page
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.authService.getAccessTokenInfo().pipe(
      switchMap((accessTokenInfo) => {
        if (!accessTokenInfo) {
          this.router.navigate([this.unauthorizedUrl]);
          return EMPTY;
        } else {
          const newRequest = request.clone({
            headers: request.headers.append('Authorization', `Bearer ${accessTokenInfo.value}`)
          });
          return next.handle(newRequest);
        }
      })
    );
  }
}
