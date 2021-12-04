import { CredentialSubject, CWTClaims, UnvalidatedCWTClaims } from "./cwtTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
  description?: string;
}

export type VerificationResult =
  | { success: true; violates: null; expires: Date; validFrom: Date; credentialSubject: CredentialSubject; raw: CWTClaims }
  | { success: false; violates: Violates; expires: Date | null; validFrom: Date | null; credentialSubject: CredentialSubject | null; raw: UnvalidatedCWTClaims | null };
