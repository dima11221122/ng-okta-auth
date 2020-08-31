import { inject, InjectionToken } from '@angular/core';
import { OktaAuth } from '@okta/okta-auth-js';
import { OKTA_AUTH_PARAMS } from './okta-auth-params-token';

export const OKTA_AUTH = new InjectionToken<OktaAuth>('Okta auth instance', {
  providedIn: 'root',
  factory: () => new OktaAuth(inject(OKTA_AUTH_PARAMS))
});
