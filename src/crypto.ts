import { sha256 } from "js-sha256";
import elliptic from "elliptic";
import { DecodedCOSEStructure } from "./coseTypes";
import { encodeToBeSigned } from "./cbor";
import { decode } from 'base64-arraybuffer'
import { toHex } from "./util";

const EC = elliptic.ec;
const ec = new EC("p256");

export function validateCOSESignature(
  decodedCOSEStructure: DecodedCOSEStructure,
  publicKeyJwt: JsonWebKey
): boolean {
  // protected is a typescript keyword
  const [protected_, , payload_, signature_] = decodedCOSEStructure.value;

  // verified at a earlier point...
  if (!publicKeyJwt.x || !publicKeyJwt.y) {
    return false;
  }

  const xBuf = new Uint8Array(decode(publicKeyJwt.x.replace(/-/g, '+').replace(/_/g, '/')))
  const yBuf = new Uint8Array(decode(publicKeyJwt.y.replace(/-/g, '+').replace(/_/g, '/')))

  // 1) '04' + hex string of x + hex string of y
  const publicKeyHex = `04${toHex(xBuf)}${toHex(yBuf)}`;
  const key = ec.keyFromPublic(publicKeyHex, "hex");
  //   Sig_structure = [
  //     context : "Signature" / "Signature1" / "CounterSignature",
  //     body_protected : empty_or_serialized_map,
  //     ? sign_protected : empty_or_serialized_map,
  //     external_aad : bstr,
  //     payload : bstr
  // ]

  const ToBeSigned = encodeToBeSigned(protected_ as Uint8Array, payload_ as Uint8Array);
  const messageHash = sha256.digest(ToBeSigned);
  const signature = {
    r: (signature_ as Uint8Array).slice(0, (signature_ as Uint8Array).length / 2),
    s: (signature_ as Uint8Array).slice((signature_ as Uint8Array).length / 2),
  };
  const result = key.verify(messageHash, signature);
  return result;
}
