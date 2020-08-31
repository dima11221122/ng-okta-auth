# ng-okta-auth

This is an angular wrapper for [Okta Auth JavaScript SDK](https://github.com/okta/okta-auth-js). 

## Quick start

1. npm i ng-okta-auth
2. In `app.module` import `OktaAuthModule.forRoot()` and provide the necessary configuration:
```typescript
import { OKTA_AUTH_PARAMS, OKTA_UNAUTHORIZED_URL, OktaAuthModule, OktaAuthParams, OKTA_USER_STORE } from 'ng-okta-auth';

const params: OktaAuthParams = {
  issuer: environment.oktaIssuer,
  clientId: environment.oktaClientId,
  redirectUri: window.location.origin + '/auth/callback',
  tokenManager: {
    storage: 'localStorage'
  }
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    OktaAuthModule.forRoot(),
  ],
  providers: [
    { provide: OKTA_AUTH_PARAMS, useValue: params },
    { provide: OKTA_UNAUTHORIZED_URL, useValue: '/login' },
    { provide: OKTA_USER_STORE, useExisting: UserStoreService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

- **OKTA_AUTH_PARAMS** (required): initial configuration of Okta. The full description of the interface you can find [here](https://github.com/okta/okta-auth-js/blob/92ed9c126cd1e89d988d16d19b8aab0ec64ad0da/lib/types/OktaAuthOptions.ts#L39).
- **OKTA_UNAUTHORIZED_URL** (required): a route, where we redirect a user after logout or some authentication errors.
- **OKTA_USER_STORE** (optional): a service for saving information about current user.
