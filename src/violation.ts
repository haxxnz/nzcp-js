import { Violates } from "./generalTypes";

interface ViolationOptions {
  violates: Violates
}

export class Violation extends Error{
  violates: Violates;
  constructor(options: ViolationOptions){
    super(options.violates.message);
    this.violates = options.violates;
  }
}
