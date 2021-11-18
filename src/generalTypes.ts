import { CredentialSubject, CWTClaims } from "./cwtTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
}

export type VerificationResult =
  | { success: true; violates: null; credentialSubject: CredentialSubject }
  | { success: false; violates: Violates; credentialSubject: null };

export type CWTClaimsResult =
  | { success: true; violates: null; cwtClaims: CWTClaims }
  | { success: false; violates: Violates; cwtClaims: null };

