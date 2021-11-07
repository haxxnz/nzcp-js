import { decodeCtiToJti } from "./jtiCti";

// Tests to verify Section 2.1.1 and RFC4122 are implemented properly
// https://nzcp.covid19.health.nz/#mapping-jti-cti
// https://datatracker.ietf.org/doc/html/rfc4122

// Properly formed CWT Token ID with 16 octets
test("properly formed cti is decode into jti", async () => {
  const cti = Buffer.from("60a4f54d4e304332be33ad78b1eafa4b", "hex");
  const result = decodeCtiToJti(cti);
  expect(result.jti).toBe("urn:uuid:60a4f54d-4e30-4332-be33-ad78b1eafa4b");
});

// Malformed CWT Token ID with 8 octets
test("malformed cti returns unsuccessful result", async () => {
  const cti = Buffer.from("60a4f54d4e304332", "hex");
  const result = decodeCtiToJti(cti);
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("RFC4122.4.1");
});
