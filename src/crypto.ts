import cbor from "cbor";
import { sha256 } from "js-sha256";
import elliptic from "elliptic";
import { DecodedCOSEStructure } from "./coseTypes";

const EC = elliptic.ec;
const ec = new EC("p256");

export function validateCOSESignature(
  cosePayload: DecodedCOSEStructure,
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
  const publicKeyHex = `04${xBuf.toString("hex")}${yBuf.toString("hex")}`;
  const key = ec.keyFromPublic(publicKeyHex, "hex");
  //   Sig_structure = [
  //     context : "Signature" / "Signature1" / "CounterSignature",
  //     body_protected : empty_or_serialized_map,
  //     ? sign_protected : empty_or_serialized_map,
  //     external_aad : bstr,
  //     payload : bstr
  // ]
  const SigStructure = ["Signature1", Buffer.from(protected_ as Buffer), Buffer.alloc(0), Buffer.from(payload_ as Buffer)];
  const ToBeSigned = cbor.encode(SigStructure);
  const messageHash = sha256.digest(ToBeSigned);
  const signature = {
    r: signature_.slice(0, signature_.length / 2),
    s: signature_.slice(signature_.length / 2),
  };
  const result = key.verify(messageHash, signature);
  return result;
}
