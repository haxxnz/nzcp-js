import { CWTClaims } from "./cwtPayloadTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
}

export type Result =
  | { success: true; violates: undefined }
  | { success: false; violates: Violates };

export type CWTClaimsResult =
  | { success: true; violates: undefined; cwtClaims: CWTClaims }
  | { success: false; violates: Violates; cwtClaims: undefined };
