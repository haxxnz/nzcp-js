// convert js timestamp to unix timestamp
export function currentTimestamp(): number {
  return Date.now() / 1000;
}

// from https://nzcp.covid19.health.nz/#adding-base32-padding
export function addBase32Padding(base32InputNoPadding: string): string {
  let result = base32InputNoPadding;
  while (result.length % 8 !== 0) {
    result += "=";
  }
  return result;
}

export function toHex(buffer: Uint8Array) {
  function i2hex(i: number) {
    return ('0' + i.toString(16)).slice(-2);
  }
  const hex = Array.from(buffer).map(i2hex).join('');
  return hex
}