
export function currentTimestamp(): number {
  return Date.now() / 1000;
}

export function addBase32Padding(base32InputNoPadding: string): string {
  let result = base32InputNoPadding;
  while ((result.length % 8) !== 0) {
      result += '='
  }
  return result;
}
