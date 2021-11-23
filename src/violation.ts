import { Violates } from "./generalTypes";

type ViolationOptions = Violates;

export class Violation extends Error {
  violates: Violates;
  constructor(options: ViolationOptions) {
    super(options.message);
    this.violates = options;
  }
}
