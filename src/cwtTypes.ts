export interface CredentialSubject {
  givenName: string;
  familyName: string;
  dob: string;
}

export interface VC {
  "@context": string[];
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

export type UnvalidatedCWTClaims = Partial<CWTClaims>;

export type RawCWTHeaders = Map<number, Buffer | number>;

export type RawCWTClaims = Map<
  number | string,
  string | number | Buffer | unknown
>;

interface CWTHeaders {
  kid: string;
  alg: string;
}

export type UnvalidatedCWTHeaders = Partial<CWTHeaders>;
