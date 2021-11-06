import { base32 } from "rfc4648";
import cbor from "cbor";
import fetch from "node-fetch";

import { CWTPayload } from "./cwtPayloadTypes";
import { DID } from "./didTypes";
import { addBase32Padding, currentTimestamp } from "./util";
import { validateCOSESignature } from "./crypto";

// The function below implements v1 of NZ COVID Pass - Technical Specification
// https://nzcp.covid19.health.nz/

type Result =
  | { success: true; violates: undefined }
  | {
      success: false;
      violates: {
        message: string;
        section: string;
        link: string;
      };
    };

// https://nzcp.covid19.health.nz/#trusted-issuers
// The following is a list of trusted issuer identifiers for New Zealand Covid Passes.
const nzcpTrustedIssuers = ["did:web:nzcp.identity.health.nz"]
  // TODO: verify CWT @context, type, version, credentialSubject https://nzcp.covid19.health.nz/#cwt-claims (Section 2.1-2.4)
  // TODO: verify assertionMethod and other MUSTs in https://nzcp.covid19.health.nz/#did-document (Section 5.1)

export const validateNZCovidPass = async (payload: string, trustedIssuers = nzcpTrustedIssuers): Promise<Result> => {

  // Section 4: 2D Barcode Encoding
  // Decoding the payload of the QR Code
  // https://nzcp.covid19.health.nz/#2d-barcode-encoding

  // Section 4.4
  // Parse the form of QR Code payload
  const payloadRegex = /(NZCP:\/)(\d+)\/([A-Za-z2-7=]+)/;
  const payloadMatch = payload.match(payloadRegex);
  if (!payloadMatch) {
    return {
      success: false,
      violates: {
        message:
          "The payload of the QR Code MUST be in the form `NZCP:/<version-identifier>/<base32-encoded-CWT>`",
        section: "4.4",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
  }

  const [_match, payloadPrefix, versionIdentifier, base32EncodedCWT] = payloadMatch;

  // Section 4.5
  // Check if the payload received from the QR Code begins with the prefix NZCP:/, if it does not then fail.
  if (payloadPrefix !== "NZCP:/") {
    return {
      success: false,
      violates: {
        message:
          "The payload of the QR Code MUST begin with the prefix of `NZCP:/`",
        section: "4.5",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
  }

  // Section 4.6
  // Parse the character(s) (representing the version-identifier) as an unsigned integer following the NZCP:/
  // suffix and before the next slash character (/) encountered. If this errors then fail.
  // If the value returned is un-recognized as a major protocol version supported by the verifying software then fail.
  // NOTE - for instance in this version of the specification this value MUST be 1.
  if (versionIdentifier !== "1") {
    return {
      success: false,
      violates: {
        message:
          "The version-identifier portion of the payload for the specification MUST be 1",
        section: "4.6",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
  }

  // Section 4.7
  // With the remainder of the payload following the / after the version-identifier, attempt to decode it using base32 as defined by
  // [RFC4648] NOTE add back in padding if required, if an error is encountered during decoding then fail.
  let uint8array: Uint8Array
  try {
    uint8array = base32.parse(
      // from https://nzcp.covid19.health.nz/#2d-barcode-encoding
      // Some base32 decoding implementations may fail to decode a base32 string that is missing the required padding as defined by [RFC4648].
      // [addBase32Padding] is a simple javascript snippet designed to show how an implementor can add the required padding to a base32 string.
      addBase32Padding(base32EncodedCWT),
    );
  }
  catch (error) {
    return {
      success: false,
      violates: {
        message: "The payload of the QR Code MUST be base32 encoded",
        section: "4.7",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    }
  }

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
      violates: {
        message:
          "The current datetime is after or equal to the value of the `nbf` claim",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
        section: "2.1.3.3",
      },
    };
  }

  if (currentTimestamp() < cwtPayload.exp) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message: "The current datetime is before the value of the `exp` claim",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
        section: "2.1.4.3",
      },
    };
  }

  const iss = cwtPayload.iss;

  // // Validate that the iss claim in the decoded CWT payload is an issuer you trust refer to the trusted issuers section for a trusted list, if not then fail.
  // are we supporting other issuers?
  // TODO: make a list of trusted issuers as a config option
  if (!trustedIssuers.includes(iss)) {
    return {
      success: false,
      violates: {
        message:
          "`iss` value reported in the pass does not match one listed in the trusted issuers",
        link: "https://nzcp.covid19.health.nz/#trusted-issuers",
        section: "6.3",
      },
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
      violates: {
        message: "The Issuer did does not match the issuer identifier",
        link: "https://nzcp.covid19.health.nz/#issuer-identifier",
        section: "5.5",
      },
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
      violates: {
        message:
          "New Zealand COVID Pass references a public key that is not found in the Issuers DID Document",
        link: "https://nzcp.covid19.health.nz/#bad-public-key",
        section: "7.3.1",
      },
    };
  }

  // With the retrieved public key validate the digital signature over the COSE_Sign1 structure, if an error occurs then fail.

  const result = validateCOSESignature(
    uint8array,
    verificationMethod.publicKeyJwk
  );

  if (!result) {
    return {
      success: false,
      violates: {
        message:
          "Retrieved public key does not validate `COSE_Sign1` structure",
        link:
          "https://nzcp.covid19.health.nz/#steps-to-verify-a-new-zealand-covid-pass",
        section: "7.1.2.8",
      },
    };
  }

  // With the payload returned from the COSE_Sign1 decoding, check if it is a valid CWT containing the claims defined in the data model section, if these conditions are not meet then fail.

  return { success: result, violates: undefined };
};
