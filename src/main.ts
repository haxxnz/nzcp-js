/* eslint-disable @typescript-eslint/no-unused-vars */
import { base32 } from "rfc4648";
// note: this is certainly node only, need to switch out to cbor-web for web... just get it working in node first
import cbor from "cbor";
import fetch from "node-fetch";
import crypto from "crypto";
import elliptic from "elliptic";
import { CWTPayload } from "./cwtPayloadTypes";
import { DID } from "./didTypes";
import { currentTimestamp } from "./util";

// Specification:
// https://nzcp.covid19.health.nz/#steps-to-verify-a-new-zealand-covid-pass

// TODO: should we copy paragraphs from the NZCP spec verbatim?
type Result =
  | { success: true }
  | {
      success: false;
      // error: Error;
      // violates: {
      //   section: string;
      //   link: string,
      // }
      message: string;
      section: string;
      link: string;
    };

export const validateNZCovidPass = async (payload: string): Promise<Result> => {
  // NZCP:/<version-identifier>/<base32-encoded-CWT>
  const payloadParts = payload.split("/");
  if (payloadParts.length !== 3) {
    // TODO: rewrite this logic, make it more follow the spec wording
    return {
      success: false,
      message:
        "The payload of the QR Code MUST be in the form `NZCP:/<version-identifier>/<base32-encoded-CWT>`",
      section: "§4",
      link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
    };
  }
  const [payloadPrefix, versionIdentifier, base32EncodedCtw] = payloadParts;
  // Check if the payload received from the QR Code begins with the prefix NZCP:/, if it does not then fail.
  if (payloadPrefix !== "NZCP:") {
    return {
      success: false,
      message:
        "The payload of the QR Code MUST begin with the prefix of `NZCP:/`",
      link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      section: "§4",
    };
  }
  // Parse the character(s) (representing the version-identifier) as an unsigned integer following the NZCP:/
  // suffix and before the next slash character (/) encountered. If this errors then fail.
  // If the value returned is un-recognized as a major protocol version supported by the verifying software then fail.
  // NOTE - for instance in this version of the specification this value MUST be 1.
  if (versionIdentifier !== "1") {
    return {
      success: false,
      message:
        "The version-identifier portion of the payload for the current release of the specification MUST be 1",
      link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      section: "§4",
    };
  }

  // With the remainder of the payload following the / after the version-identifier, attempt to decode it using base32 as defined by
  // [RFC4648] NOTE add back in padding if required, if an error is encountered during decoding then fail.

  const uint8array = base32.parse(
    base32EncodedCtw,
    // from https://github.com/swansontec/rfc4648.js
    // If you pass the option { loose: true } in the second parameter, the parser will not validate padding characters (=):

    // from https://nzcp.covid19.health.nz/#2d-barcode-encoding
    // Because the alphanumeric mode of QR codes does not include the = as a valid character,
    // the padding of a base32 string represented by the = character MUST be removed prior to QR code encoding.
    { loose: true }
  );

  // With the decoded payload attempt to decode it as COSE_Sign1 CBOR structure, if an error is encountered during decoding then fail.

  // Decoding this byte string as a CBOR structure and rendering it via the expanded form shown throughout [RFC7049] yields the following.
  // Let this result be known as the Decoded COSE structure.
  // d2                -- Tag #18
  // 84              -- Array, 4 items
  //   4a            -- Bytes, length: 10
  //     a204456b65792d310126 -- [0], a204456b65792d310126
  //   a0            -- [1], {}
  //   59            -- Bytes, length next 2 bytes
  //     011f        -- Bytes, length: 287
  //       a501781e6469643a7765623a6e7a63702e636f76696431392e6865616c74682e6e7a051a61819a0a041a7450400a627663a46840636f6e7465787482782668747470733a2f2f7777772e77332e6f72672f323031382f63726564656e7469616c732f7631782a68747470733a2f2f6e7a63702e636f76696431392e6865616c74682e6e7a2f636f6e74657874732f76316776657273696f6e65312e302e306474797065827456657269666961626c6543726564656e7469616c6f5075626c6963436f766964506173737163726564656e7469616c5375626a656374a369676976656e4e616d65644a61636b6a66616d696c794e616d656753706172726f7763646f626a313936302d30342d3136075060a4f54d4e304332be33ad78b1eafa4b -- [2], a501781e6469643a7765623a6e7a63702e636f76696431392e6865616c74682e6e7a051a61819a0a041a7450400a627663a46840636f6e7465787482782668747470733a2f2f7777772e77332e6f72672f323031382f63726564656e7469616c732f7631782a68747470733a2f2f6e7a63702e636f76696431392e6865616c74682e6e7a2f636f6e74657874732f76316776657273696f6e65312e302e306474797065827456657269666961626c6543726564656e7469616c6f5075626c6963436f766964506173737163726564656e7469616c5375626a656374a369676976656e4e616d65644a61636b6a66616d696c794e616d656753706172726f7763646f626a313936302d30342d3136075060a4f54d4e304332be33ad78b1eafa4b
  //   58            -- Bytes, length next 1 byte
  //     40          -- Bytes, length: 64
  const decodedCOSEStructure = cbor.decode(uint8array);

  // Decoding the byte string present in the first element of the Decoded COSE structure, as a CBOR structure and rendering it via the expanded form yields the following.
  // Let this result be known as the Decoded CWT protected headers.
  // a2                -- Map, 2 pairs
  // 04              -- {Key:0}, 4
  // 45              -- Bytes, length: 5
  //   6b65792d31    -- {Val:0}, 6b65792d31
  // 01              -- {Key:1}, 1
  // 26              -- {Val:1}, -7
  const decodedCWTProtectedHeaders = cbor.decode(
    decodedCOSEStructure.value[0]
  ) as Map<number, Buffer | number>;

  // quickly looked at some libs but they didn't look like they handled this...
  // this will need to be rewritten
  // TODO:

  // With the headers returned from the COSE_Sign1 decoding step, check for the presence
  // of the required headers as defined in the data model section, if these conditions are not meet then fail.
  const CWTHeaderKid = decodedCWTProtectedHeaders.get(4);
  let kid: string;
  if (CWTHeaderKid) {
    kid = CWTHeaderKid.toString();
  } else {
    throw Error(
      "§2.2.kid.1 This header MUST be present in the protected header section of the `COSE_Sign1` structure"
    );
  }
  const CWTHeaderAlg = decodedCWTProtectedHeaders.get(1);
  if (CWTHeaderAlg) {
    if (CWTHeaderAlg === -7) {
      // alg = "ES256"
      // pass
    } else {
      throw Error(
        "§2.2.alg.2 claim value MUST be set to the value corresponding to ES256 algorithm registration"
      );
    }
  } else {
    throw Error(
      "§2.2.alg.1 This header MUST be present in the protected header section of the `COSE_Sign1` structure"
    );
  }

  const decodedCWTPayload = cbor.decode(decodedCOSEStructure.value[2]) as Map<
    number | string,
    string | number | Buffer | unknown
  >;

  // quickly looked at some libs but they didn't look like they handled this...
  // this will need to be rewritten
  const cwtPayload = Array.from(decodedCWTPayload.entries()).reduce(
    (prev, [key, value]) => {
      if (key === 1) {
        return { ...prev, iss: value };
      }
      if (key === 7) {
        if (value instanceof Buffer) {
          const hexUuid = value.toString("hex");
          return {
            ...prev,
            jti: `urn:uuid:${hexUuid.slice(0, 8)}-${hexUuid.slice(
              8,
              12
            )}-${hexUuid.slice(12, 16)}-${hexUuid.slice(
              16,
              20
            )}-${hexUuid.slice(20, 32)}`,
          };
        }
      }
      if (key === 4) {
        return { ...prev, exp: value };
      }
      if (key === 5) {
        return { ...prev, nbf: value };
      }
      if (key === "vc") {
        return { ...prev, vc: value };
      }
      throw Error();
    },
    {}
  ) as CWTPayload;

  if (currentTimestamp() >= cwtPayload.nbf) {
    // pass
  } else {
    return {
      success: false,
      message:
        "The current datetime is after or equal to the value of the `nbf` claim",
      link: "https://nzcp.covid19.health.nz/#cwt-claims",
      section: "§2.1.nbf.3",
    };
  }

  if (currentTimestamp() < cwtPayload.exp) {
    // pass
  } else {
    return {
      success: false,
      message:
        "§2.1.exp.3 The current datetime is before the value of the `exp` claim",
      link: "https://nzcp.covid19.health.nz/#cwt-claims",
      section: "§2.1.exp.3",
    };
  }

  // did:web:nzcp.covid19.health.nz
  const iss = cwtPayload.iss;

  // // Validate that the iss claim in the decoded CWT payload is an issuer you trust refer to the trusted issuers section for a trusted list, if not then fail.
  // are we supporting other issuers?
  // TODO: make a list of trusted issuers as a config option
  if (iss !== "did:web:nzcp.covid19.health.nz") {
    return {
      success: false,
      message:
        "`iss` value reported in the pass does not match one listed in the trusted issuers",
      link: "https://nzcp.covid19.health.nz/#issuer-identifier",
      section: "§5",
    };
  }

  // Following the rules outlined in issuer identifier retrieve the issuers public key that was used to sign the CWT, if an error occurs then fail.
  const wellKnownDidEndpoint =
    iss.replace("did:web:", "https://") + "/.well-known/did.json";
  const response = await fetch(wellKnownDidEndpoint);
  const did = (await response.json()) as DID;

  // TODO: we should not be doing this on our own - use https://github.com/decentralized-identity/web-did-resolver
  if (did.id !== iss) {
    return {
      success: false,
      message: "The Issuer did does not match the issuer identifier",
      link: "https://nzcp.covid19.health.nz/#issuer-identifier",
      section: "§5",
    };
  }

  // {
  //   "@context": "https://w3.org/ns/did/v1",
  //   "id": "did:web:nzcp.covid19.health.nz",
  //   "verificationMethod": [
  //     {
  //       "id": "did:web:nzcp.covid19.health.nz#key-1",
  //       "controller": "did:web:nzcp.covid19.health.nz",
  //       "type": "JsonWebKey2020",
  //       "publicKeyJwk": {
  //         "kty": "EC",
  //         "crv": "P-256",
  //         "x": "zRR-XGsCp12Vvbgui4DD6O6cqmhfPuXMhi1OxPl8760",
  //         "y": "Iv5SU6FuW-TRYh5_GOrJlcV_gpF_GpFQhCOD8LSk3T0"
  //       }
  //     }
  //   ],
  //   "assertionMethod": [
  //     "did:web:nzcp.covid19.health.nz#key-1"
  //   ]
  // }
  const verificationMethod = did.verificationMethod.find(
    (v) => v.id === `${iss}#${kid}`
  );

  if (!verificationMethod) {
    // TODO: is it ok to reference examples?
    return {
      success: false,
      message:
        "New Zealand COVID Pass references a public key that is not found in the Issuers DID Document",
      link: "https://nzcp.covid19.health.nz/#bad-public-key",
      section: "§7.3.1",
    };
  }

  // // With the retrieved public key validate the digital signature over the COSE_Sign1 structure, if an error occurs then fail.

  // VERIFICATION ATTEMPT #1. Manual.

  // eslint-disable-next-line prefer-const
  // example CWT structure (https://datatracker.ietf.org/doc/html/rfc8392#appendix-A.3)
  // 18(
  //   [
  //     / protected / << {
  //       / alg / 1: -7 / ECDSA 256 /
  //     } >>,
  //     / unprotected / {
  //       / kid / 4: h'4173796d6d657472696345434453413
  //                    23536' / 'AsymmetricECDSA256' /
  //     },
  //     / payload / << {
  //       / iss / 1: "coap://as.example.com",
  //       / sub / 2: "erikw",
  //       / aud / 3: "coap://light.example.com",
  //       / exp / 4: 1444064944,
  //       / nbf / 5: 1443944944,
  //       / iat / 6: 1443944944,
  //       / cti / 7: h'0b71'
  //     } >>,
  //     / signature / h'5427c1ff28d23fbad1f29c4c7c6a555e601d6fa29f
  //                     9179bc3d7438bacaca5acd08c8d4d4f96131680c42
  //                     9a01f85951ecee743a52b9b63632c57209120e1c9e
  //                     30'
  //   ]
  // )
  // start again for verifying...
  const obj = cbor.decode(uint8array);
  // adding _ to the end not to clash with previous things in this fn
  // eslint-disable-next-line prefer-const
  let [protected_, unprotected_, payload_, signature_] = obj.value;
  //p = cbor.decodeFirstSync(p);
  unprotected_ = Buffer.alloc(0);
  unprotected_ = unprotected_ || new Buffer("");

  const EC = elliptic.ec;
  const ec = new EC("p256");

  const x = Buffer.from(verificationMethod.publicKeyJwk.x, "base64");
  const y = Buffer.from(verificationMethod.publicKeyJwk.y, "base64");

  // Public Key MUST be either:
  // 1) '04' + hex string of x + hex string of y; or
  // x : zRR-XGsCp12Vvbgui4DD6O6cqmhfPuXMhi1OxPl8760 y: Iv5SU6FuW-TRYh5_GOrJlcV_gpF_GpFQhCOD8LSk3T0
  const key = ec.keyFromPublic(
    `04${x.toString("hex")}${y.toString("hex")}}`,
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

  if (!result) {
    return {
      success: false,
      message: "Retrieved public key does not validate `COSE_Sign1` structure",
      link: "https://nzcp.covid19.health.nz/#steps-to-verify-a-new-zealand-covid-pass",
      section: "§7.1",
    };
  }

  // With the payload returned from the COSE_Sign1 decoding, check if it is a valid CWT containing the claims defined in the data model section, if these conditions are not meet then fail.

  return { success: result as true };
};
