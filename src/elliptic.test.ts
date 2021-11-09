import elliptic from "elliptic";

const fromHexString = (hexString: string) =>
  new Uint8Array(
    (hexString.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16))
  );

test("elliptic library works", async () => {
  const publicKeyHex =
    "04cd147e5c6b02a75d95bdb82e8b80c3e8ee9caa685f3ee5cc862d4ec4f97cefad22fe5253a16e5be4d1621e7f18eac995c57f82917f1a9150842383f0b4a4dd3d";
  const messageHashHex =
    "0513bb48e77bcfa51209a78d3224b0b2f1a29a9b9c0eff2263b6d08156aee72a";
  const signatureRHex =
    "f6a9a841a390a40bd5cee4434cccdb7499d9461840f5c8dff436cba0698b1ab2";
  const signatureSHex =
    "4dca052720b9f581200bebac2fff1afa159ce42aeb38d558df9413899db48271";

  const signature = {
    r: fromHexString(signatureRHex),
    s: fromHexString(signatureSHex),
  };

  const EC = elliptic.ec;
  const ec = new EC("p256");
  const key = ec.keyFromPublic(publicKeyHex, "hex");
  const result = key.verify(fromHexString(messageHashHex), signature);
  expect(result).toBe(true);
});
