
interface CredentialSubject {
  givenName: string;
  familyName: string;
  dob: string;
}

interface Vc {
  '@context': string[];
  version: string;
  type: string[];
  credentialSubject: CredentialSubject;
}

export interface CWTPayload {
  iss: string;
  nbj: number;
  exp: number;
  vc: Vc;
  jti: string;
}
