import { CWTClaims } from "./cwtPayloadTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
}

export type Result =
  | { success: true; violates: null }
  | { success: false; violates: Violates };

export type CWTClaimsResult =
  | { success: true; violates: null; cwtClaims: CWTClaims }
  | { success: false; violates: Violates; cwtClaims: null };

export type JTIResult =
  | { success: true; violates: null; jti: string }
  | { success: false; violates: Violates; jti: null };
