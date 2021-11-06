
interface CredentialSubject {
  givenName: string;
  familyName: string;
  dob: string;
}

export interface VC {
  '@context': string[];
  version: string;
  type: string[];
  credentialSubject: CredentialSubject;
}

export interface CWTClaims {
  iss: string;
  nbf: number;
  exp: number;
  vc: VC;
  jti: string;
}
