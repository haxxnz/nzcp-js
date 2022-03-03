import { decodeCtiToJti } from "./jtiCti";
import { Violation } from "./violation";

// Tests to verify Section 2.1.1 and RFC4122 are implemented properly
// https://nzcp.covid19.health.nz/#mapping-jti-cti
// https://datatracker.ietf.org/doc/html/rfc4122

// Properly formed CWT Token ID with 16 octets
test("properly formed cti is decode into jti", async () => {
  const cti = new Uint8Array([0x60, 0xa4, 0xf5, 0x4d, 0x4e, 0x30, 0x43, 0x32, 0xbe, 0x33, 0xad, 0x78, 0xb1, 0xea, 0xfa, 0x4b])
  const result = decodeCtiToJti(cti);
  expect(result).toBe("urn:uuid:60a4f54d-4e30-4332-be33-ad78b1eafa4b");
});

// Malformed CWT Token ID with 8 octets
test("malformed cti returns unsuccessful result", async () => {
  const cti = new Uint8Array([0x60, 0xa4, 0xf5, 0x4d, 0x4e, 0x30, 0x43, 0x32])
  expect(() => decodeCtiToJti(cti)).toThrowError(Violation);
});
