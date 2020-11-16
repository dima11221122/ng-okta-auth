import { OktaUserInfo } from './okta-user-info';

/**
 * This store should be implemented on a client side and
 * can be used both internally in the package and inside an app.
 */
export interface OktaUserStore {
  setOktaUser(params: OktaUserInfo | null | undefined): void;

  // reset the value of current user. Usually it's used after logout or some authorization errors
  resetUser(): void;
}
