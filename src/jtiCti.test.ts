import { decodeCtiToJti } from "./jtiCti";

test("properly formed cti is decode into jti", async () => {
  const cti = Buffer.from("60a4f54d4e304332be33ad78b1eafa4b", "hex");
  const result = decodeCtiToJti(cti);
  expect(result.jti).toBe("urn:uuid:60a4f54d-4e30-4332-be33-ad78b1eafa4b");
});

test("malformed cti returns unsuccessful result", async () => {
  const cti = Buffer.from("60a4f54d4e30433", "hex");
  const result = decodeCtiToJti(cti);
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("RFC4122.4.1");
});
