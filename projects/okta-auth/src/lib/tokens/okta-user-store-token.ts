import { InjectionToken } from '@angular/core';
import { OktaUserStore } from '../models/okta-user-store';

export const OKTA_USER_STORE = new InjectionToken<OktaUserStore>('Okta user store');
