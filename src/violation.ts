import { UnvalidatedCWTClaims } from "./cwtTypes";
import { Violates } from "./generalTypes";

type ViolationOptions = Violates;

export class Violation extends Error {
  violates: Violates;
  cwtClaims: UnvalidatedCWTClaims | null
  constructor(options: ViolationOptions, cwtClaims: UnvalidatedCWTClaims | null = null) {
    super(options.message);
    this.violates = options;
    this.cwtClaims = cwtClaims;
  }
}
