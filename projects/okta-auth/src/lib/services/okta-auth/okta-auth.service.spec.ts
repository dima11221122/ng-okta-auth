import { HttpClient } from '@angular/common/http';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { OktaAuthService } from './okta-auth.service';
import {
  OktaAuth,
  SessionAPI,
  TokenAPI,
  TokenManager
} from '@okta/okta-auth-js';
import { of } from 'rxjs';
import { accessTokenStub, idTokenStub, tokensResponseStub, userStub } from './okta-auth.stubs';
import { first } from 'rxjs/operators';
import { OktaAuthParams } from '../../tokens/okta-auth-params-token';
import { OktaUserStore } from '../../models/okta-user-store';
import { OktaUserInfo } from '../../models/okta-user-info';

describe('AuthService', () => {
  let httpClient: HttpClient;
  let serviceWithUserStore: OktaAuthService;
  let serviceWithoutUserStore: OktaAuthService;
  let userStore: OktaUserStore;
  let oktaAuth: OktaAuth;
  let oktaSession: SessionAPI;
  let oktaToken: TokenAPI;
  let oktaTokenManager: TokenManager;
  let oktaParams: OktaAuthParams;

  const buildOktaMock = () => {
    oktaSession = mock<SessionAPI>();
    oktaToken = mock<TokenAPI>();
    oktaTokenManager = mock<TokenManager>();
    userStore = mock<OktaUserStore>();

    oktaAuth = mock(OktaAuth);
    when(oktaAuth.session).thenReturn(instance(oktaSession));
    when(oktaAuth.token).thenReturn(instance(oktaToken));
    when(oktaAuth.tokenManager).thenReturn(instance(oktaTokenManager));
  };

  beforeEach(() => {
    httpClient = mock(HttpClient);
    oktaParams = {
      issuer: 'https://user.oktapreview.com/oauth2/default',
      clientId: '1312kjasdfz324asad',
      redirectUri: '/auth/callback',
      tokenManager: {
        storage: 'localStorage'
      }
    }
    buildOktaMock();
    serviceWithUserStore = new OktaAuthService(
      instance(httpClient),
      instance(oktaAuth),
      oktaParams,
      '/logout',
      instance(userStore)
    );
    serviceWithoutUserStore = new OktaAuthService(instance(httpClient), instance(oktaAuth), oktaParams, '/logout');
  });

  const mockLoadingUserInformation = () => {
    when(
      httpClient
        .get('https://user.oktapreview.com/api/v1/users/me', deepEqual({ withCredentials: true }))
    ).thenReturn(of(userStub));
  };

  const mockGettingOktaToken = () => {
    when(oktaToken.getWithoutPrompt(deepEqual({ pkce: true }))).thenReturn(Promise.resolve(tokensResponseStub));
  };

  const checkIfUserLoadedCorrectly = (done) => {
    verify(userStore.setOktaUser(deepEqual(userStub))).once();
    verify(oktaTokenManager.add('idToken', idTokenStub)).once();
    verify(oktaTokenManager.add('accessToken', accessTokenStub));
    done();
  };

  describe('#initAuthorization', () => {
    describe('should initialize current user and tokens correctly', () => {
      const preparation = () => {
        when(oktaSession.exists()).thenReturn(Promise.resolve(true));
        mockGettingOktaToken();
        mockLoadingUserInformation();
      };
      it('with user store', (done) => {
        preparation();
        serviceWithUserStore.initAuthorization().pipe(first()).subscribe((user: OktaUserInfo) => {
          expect(user).toEqual(userStub);
          checkIfUserLoadedCorrectly(done);
        }, done.fail);
      });

      it('without user', (done) => {
        preparation();
        serviceWithUserStore.initAuthorization().pipe(first()).subscribe((user: OktaUserInfo) => {
          expect(user).toEqual(userStub);
          done();
        }, done.fail);
      });
    });

    const checkIfUserNotChanged = done => {
      serviceWithUserStore.initAuthorization().pipe(first()).subscribe(() => {
        verify(userStore.setOktaUser(deepEqual(userStub))).never();
        verify(oktaTokenManager.add(anything(), anything())).never();
        done();
      }, done.fail);
    };

    it('should not load user if session does not exist', (done) => {
      when(oktaSession.exists()).thenReturn(Promise.resolve(false));
      checkIfUserNotChanged(done);
    });

    it('should not load user if there is no tokens in token manager', (done) => {
      when(oktaSession.exists()).thenReturn(Promise.resolve(false));
      when(oktaToken.getWithoutPrompt(deepEqual({ pkce: true }))).thenReturn(Promise.resolve(null));
      checkIfUserNotChanged(done);
    });
  });

  describe('#login', () => {
    describe('correct login', () => {
      const username = 'user';
      const password = 'password';
      const prepareLogin = () => {
        mockLoadingUserInformation();
        const sessionToken = 'test session token';
        when(oktaAuth.signIn(deepEqual({ username, password }))).thenReturn(Promise.resolve({
          data: {},
          status: 'SUCCESS',
          sessionToken
        }));
        when(oktaToken.getWithoutPrompt(deepEqual({
          sessionToken,
          pkce: true
        }))).thenReturn(Promise.resolve(tokensResponseStub));
      };

      it('with user store', (done) => {
        prepareLogin();
        serviceWithUserStore.login(username, password).pipe(
          first(),
        ).subscribe((user: OktaUserInfo) => {
          expect(user).toEqual(userStub);
          checkIfUserLoadedCorrectly(done);
        }, done.fail);
      });

      it('without user store', (done) => {
        prepareLogin();
        serviceWithUserStore.login(username, password).pipe(
          first(),
        ).subscribe((user) => {
          expect(user).toEqual(userStub);
          done();
        }, done.fail);
      });
    });

    it('incorrect login', (done) => {
      const username = 'user';
      const password = 'password';
      when(oktaAuth.signIn(deepEqual({ username, password }))).thenReturn(Promise.resolve({
        status: 'ERROR',
        data: {}
      }));
      serviceWithUserStore.login(username, password).pipe(
        first()
      ).subscribe(() => done.fail(), (e) => {
        expect(e.message).toEqual('We cannot handle the ERROR status');
        done();
      });
    });
  });

  describe('#logout', () => {
    it('should logout corretly', (done) => {
      const redirectUrl = 'http://localhost:9876/logout';
      const oktaSignOutParams = {
        postLogoutRedirectUri: redirectUrl
      };
      when(oktaAuth.signOut(deepEqual(oktaSignOutParams))).thenReturn(Promise.resolve());
      serviceWithUserStore.logout().pipe(
        first()
      ).subscribe(() => {
        verify(oktaAuth.signOut(deepEqual(oktaSignOutParams))).once();
        verify(userStore.resetUser()).once();
        done();
      }, done.fail);
    });
  });

  describe('#checkAuthenticated', () => {
    it('should return true if there is a token', (done) => {
      when(oktaSession.exists()).thenReturn(Promise.resolve(true));
      when(oktaTokenManager.get('accessToken')).thenReturn(Promise.resolve(accessTokenStub));
      serviceWithUserStore.checkAuthenticated().pipe(first()).subscribe(isAuthenticated => {
        expect(isAuthenticated).toBeTrue();
        done();
      }, done.fail);
    });
    it('should return false if there is no session', (done) => {
      when(oktaSession.exists()).thenReturn(Promise.resolve(false));
      serviceWithUserStore.checkAuthenticated().pipe(first()).subscribe(isAuthenticated => {
        expect(isAuthenticated).toBeFalse();
        done();
      }, done.fail);
    });
    it('should return false if there is no token', (done) => {
      when(oktaSession.exists()).thenReturn(Promise.resolve(true));
      when(oktaTokenManager.get('accessToken')).thenReturn(Promise.resolve(null));
      serviceWithUserStore.checkAuthenticated().pipe(first()).subscribe(isAuthenticated => {
        expect(isAuthenticated).toBeFalse();
        done();
      }, done.fail);
    });
  });
});
