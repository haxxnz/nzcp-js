import { CredentialSubject, CWTClaims } from "./cwtTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
  description?: string;
}

export type VerificationResult =
  | { success: true; violates: null; expires: number | null; validFrom: number | null; credentialSubject: CredentialSubject; raw: CWTClaims | Partial<CWTClaims> }
  | { success: false; violates: Violates; credentialSubject: null };
