export interface PublicKeyJwk {
  kty: string;
  crv: string;
  x: string;
  y: string;
}

export interface VerificationMethod {
  id: string;
  controller: string;
  type: string;
  publicKeyJwk: PublicKeyJwk;
}

export interface DID {
  "@context": string;
  id: string;
  verificationMethod: VerificationMethod[];
  assertionMethod: string[];
}


