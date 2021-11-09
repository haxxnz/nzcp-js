type DecodedCOSEValue = (Buffer | Record<string, never>)[];

export interface DecodedCOSEStructure {
  tag: number;
  value: DecodedCOSEValue;
  err?: Error;
}
