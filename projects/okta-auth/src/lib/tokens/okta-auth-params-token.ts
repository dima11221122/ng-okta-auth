import { InjectionToken } from '@angular/core';
import { OktaAuthOptions } from '@okta/okta-auth-js';

export type OktaAuthParams = OktaAuthOptions;

export const OKTA_AUTH_PARAMS = new InjectionToken<OktaAuthParams>('Okta auth params');
