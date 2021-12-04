import { CredentialSubject } from "./cwtTypes";
import { Violates } from "./generalTypes";

type ViolationOptions = Violates;

export class Violation extends Error {
  violates: Violates;
  credentialSubject: CredentialSubject | null
  constructor(options: ViolationOptions, credentialSubject: CredentialSubject | null = null) {
    super(options.message);
    this.violates = options;
    this.credentialSubject = credentialSubject;
  }
}
