import cbor from "cbor";
import crypto from "crypto";
import elliptic from "elliptic";
import { COSETaggedItem } from "./coseTypes";

const EC = elliptic.ec;
const ec = new EC("p256");

export function validateCOSESignature(
  cosePayload: COSETaggedItem,
  publicKeyJwt: JsonWebKey
): boolean {
  // protected is a typescript keyword
  const [protected_, , payload_, signature_] = cosePayload.value;

  // verified at a earlier point...
  if (!publicKeyJwt.x || !publicKeyJwt.y) {
    return false;
  }

  const xBuf = Buffer.from(publicKeyJwt.x, "base64");
  const yBuf = Buffer.from(publicKeyJwt.y, "base64");

  // 1) '04' + hex string of x + hex string of y
  const key = ec.keyFromPublic(
    `04${xBuf.toString("hex")}${yBuf.toString("hex")}}`,
    "hex"
  );
  //   Sig_structure = [
  //     context : "Signature" / "Signature1" / "CounterSignature",
  //     body_protected : empty_or_serialized_map,
  //     ? sign_protected : empty_or_serialized_map,
  //     external_aad : bstr,
  //     payload : bstr
  // ]
  const SigStructure = ["Signature1", protected_, Buffer.alloc(0), payload_];
  const ToBeSigned = cbor.encode(SigStructure);
  const messageHash = crypto.createHash("SHA256").update(ToBeSigned).digest();
  const signature = {
    r: signature_.slice(0, signature_.length / 2),
    s: signature_.slice(signature_.length / 2),
  };
  const result = key.verify(messageHash, signature);
  return result;
}
