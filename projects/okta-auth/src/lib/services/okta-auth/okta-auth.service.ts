import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OKTA_AUTH } from '../../tokens/okta-auth-token';
import { AuthTransaction, OktaAuth, Token, TokenResponse } from '@okta/okta-auth-js';
import { defer, from, Observable, of } from 'rxjs';
import { map, mapTo, switchMap, tap } from 'rxjs/operators';
import { OKTA_AUTH_PARAMS, OktaAuthParams } from '../../tokens/okta-auth-params-token';
import { OktaUserInfo } from '../../models/okta-user-info';
import { OKTA_UNAUTHORIZED_URL } from '../../tokens/okta-unauthorized-url-token';
import { OKTA_USER_STORE } from '../../tokens/okta-user-store-token';
import { OktaUserStore } from '../../models/okta-user-store';

// AuthTransaction interface is missing "user" fieild. 
// The interface below could be removed in the future when AuthTransaction interface
// will be updated in the @okta/okta-auth-js library.

interface IAuthTransaction extends AuthTransaction {
  user?: OktaUserInfo
};

const ACCESS_TOKEN_KEY = 'accessToken';

@Injectable({
  providedIn: 'root'
})
export class OktaAuthService {

  constructor(
    private httpClient: HttpClient,
    @Inject(OKTA_AUTH) private authClient: OktaAuth,
    @Inject(OKTA_AUTH_PARAMS) private authParams: OktaAuthParams,
    @Inject(OKTA_UNAUTHORIZED_URL) private unauthorizedUrl: string,
    @Optional() @Inject(OKTA_USER_STORE) private userStore?: OktaUserStore,
  ) { }

  /**
   * Request authorization token and put it in store
   */
  initAuthorization(): Observable<OktaUserInfo | null> {
    return defer(() => from(this.authClient.session.exists()))
      .pipe(
        switchMap((res) => {
          if (res) {
            return from(this.authClient.token.getWithoutPrompt({
              pkce: true
            }));
          } else {
            return of(false);
          }
        }),
        switchMap((res) => {
          if (res) {
            this.saveTokens(res);
            return this.getUserInfo();
          }

          return of(null);
        }),
        tap((oktaUser: OktaUserInfo | null) => this.userStore?.setOktaUser(oktaUser))
      );

  }

  private getAuthProviderOrigin(): string {
    if (!this.authParams.issuer) {
      return '';
    }

    return (new URL(this.authParams.issuer)).origin;
  }

  getUserInfo(): Observable<OktaUserInfo> {
    return this.httpClient.get<OktaUserInfo>(`${this.getAuthProviderOrigin()}/api/v1/users/me`, { withCredentials: true });
  }

  login(username: string, password: string): Observable<TokenResponse> {
    return defer(() => from(this.authClient.signInWithCredentials({ username, password })))
      .pipe(
        switchMap((transaction: IAuthTransaction) => {
          if (transaction.status !== 'SUCCESS') {
            throw Error('We cannot handle the ' + transaction.status + ' status');
          }

          this.userStore?.setOktaUser(transaction.user);

          return from(this.authClient.token.getWithoutPrompt({
            sessionToken: transaction.sessionToken,
            pkce: true
          }));
        }),
        tap((res) => this.saveTokens(res)),
      );
  }

  /**
   * Return true if user is authenticated and successfully
   * received token
   *
   * Since user may have valid session, but not be able to receive
   * access token because he does not have access to ISP app
   */
  checkAuthenticated(): Observable<boolean> {
    return defer(() => from(this.authClient.session.exists()))
      .pipe(
        switchMap((isAuthenticated: boolean) => {
          if (isAuthenticated) {
            return this.getAccessTokenInfo();
          } else {
            return of(isAuthenticated);
          }
        }),
        // convert getAccessTokenInfo to boolean
        map(isAuthenticated => !!isAuthenticated)
      );
  }

  getAccessTokenInfo(): Observable<Token> {
    return defer(() => from(this.authClient.tokenManager.get(ACCESS_TOKEN_KEY)));
  }

  private getFullUrl(path: string): string {
    return window.location.origin + path;
  }

  logout(): Observable<void> {
    return defer(() => from(this.authClient.signOut({
      postLogoutRedirectUri: this.getFullUrl(this.unauthorizedUrl)
    })))
      .pipe(
        mapTo(undefined),
        tap(() => this.userStore?.resetUser())
      );
  }

  private isTokenResponse(data): data is TokenResponse {
    return data.tokens;
  }

  private saveTokens(res: TokenResponse | true): void {
    if (res && this.isTokenResponse(res) && res.tokens.idToken && res.tokens.accessToken) {
      const { idToken, accessToken } = res.tokens;

      this.authClient.tokenManager.setTokens({
        idToken,
        accessToken 
      });
    }
  }
}
