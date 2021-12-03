import { CredentialSubject, CWTClaims } from "./cwtTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
  description?: string;
}

export type VerificationResult =
  | { success: true; violates: null; expires: Date | undefined; validFrom: Date | undefined; credentialSubject: CredentialSubject; raw: CWTClaims | Partial<CWTClaims> }
  | { success: false; violates: Violates; credentialSubject: null; };
