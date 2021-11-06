
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

// TODO: rename to CWT claims
export interface CWTClaims {
  iss: string;
  nbf: number;
  exp: number;
  vc: VC;
  jti: string;
}
