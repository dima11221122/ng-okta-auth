import { AbstractToken, AccessToken, IDToken, TokenResponse } from '@okta/okta-auth-js';
import { OktaUserInfo } from '../../models/okta-user-info';

const baseToken: AbstractToken = {
  authorizeUrl: 'authorizeUrl',
  expiresAt: 321312312321,
  scopes: ['scope1'],
  value: '1231231adfasf2e'
};
export const accessTokenStub: AccessToken = {
  ...baseToken,
  accessToken: '123321',
  tokenType: 'accessToken',
  userinfoUrl: 'userinfourl'
};

export const idTokenStub: IDToken = {
  ...baseToken,
  idToken: '11111111',
  claims: {
    sub: ''
  },
  issuer: 'issuer',
  clientId: 'clientId'
};

export const tokensResponseStub: TokenResponse = {
  state: 'some string',
  tokens: {
    accessToken: accessTokenStub,
    idToken: idTokenStub
  }
};

export const userStub: OktaUserInfo = {
  id: 'okta-user-info-id',
  status: 'status',
  created: new Date(),
  activated: new Date(),
  statusChanged: new Date(),
  lastLogin: new Date(),
  lastUpdated: new Date(),
  passwordChanged: new Date(),
  type: { id: 'typeID' },
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    login: 'JohnDoe',
    email: 'JohnDoe@gmail.com'
  },
  credentials: {
    password: 'password',
    provider: {
      name: 'providerName',
      type: 'providerType'
    }
  }
};
