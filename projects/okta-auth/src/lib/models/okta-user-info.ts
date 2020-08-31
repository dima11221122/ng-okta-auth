interface Type {
  id: string;
}

interface Profile {
  firstName: string;
  lastName: string;
  mobilePhone?: any;
  secondEmail?: any;
  login: string;
  email: string;
}

interface Provider {
  type: string;
  name: string;
}

interface Credentials {
  password: any;
  provider: Provider;
}

export interface OktaUserInfo {
  id: string;
  status: string;
  created: Date;
  activated: Date;
  statusChanged: Date;
  lastLogin: Date;
  lastUpdated: Date;
  passwordChanged: Date;
  type: Type;
  profile: Profile;
  credentials: Credentials;
}
