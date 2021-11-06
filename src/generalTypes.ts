import { CWTPayload } from "./cwtPayloadTypes";

export interface Violates {
  message: string;
  section: string;
  link: string;
}

export type Result =
  | { success: true; violates: undefined }
  | { success: false; violates: Violates };

export type CWTResult =
  | { success: true; violates: undefined; cwtPayload: CWTPayload }
  | { success: false; violates: Violates; cwtPayload: undefined };
