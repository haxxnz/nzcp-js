import { base32 } from "rfc4648";
import did from "./did";
import { addBase32Padding } from "./util";
import { validateCOSESignature } from "./crypto";
import { parseCWTClaims, parseCWTHeaders, validateCWTClaims } from "./cwt";
import { VerificationResult, Violates } from "./generalTypes";
import { decodeCBOR } from "./cbor";
import { CredentialSubject } from "./cwtTypes";
import { DIDDocument } from "did-resolver";

// The function below implements v1 of NZ COVID Pass - Technical Specification
// https://nzcp.covid19.health.nz/

// https://nzcp.covid19.health.nz/#trusted-issuers
// The following is a list of trusted issuer identifiers for New Zealand Covid Passes.
const liveTrustedIssuer = "did:web:nzcp.identity.health.nz";

export { VerificationResult, CredentialSubject, Violates, DIDDocument };

type VerifyPassURIOptions = {
  trustedIssuer: string | string[];
};

// TODO: add tests for every error path

/**
 * Verifies a COVID-19 Vaccination Passport using a custom list of trusted issuers.
 * @param {string} uri the COVID-19 Passport URI to be verified
 * @param {VerifyPassURIOptions} options options for the verification
 * @returns {Promise<VerificationResult>} a verfication result of type Promise<VerificationResult>
 * @see https://nzcp.covid19.health.nz/#trusted-issuers for a list of trusted issuers
 * @example <caption>Implementation of custom trusted issuers:</caption>
 * const result = await verifyPassURI("NZCP:/1/2KCEVIQEIVV...", { trustedIssuer: "did:web:nzcp.covid19.health.nz" });
 */
export const verifyPassURI = async (
  uri: string,
  options?: VerifyPassURIOptions,
): Promise<VerificationResult> => {
  const trustedIssuers = options ? Array.isArray(options.trustedIssuer) ? options.trustedIssuer : [options.trustedIssuer] : [liveTrustedIssuer];

  // Section 4: 2D Barcode Encoding
  // Decoding the payload of the QR Code
  // https://nzcp.covid19.health.nz/#2d-barcode-encoding

  // Section 4.3
  // QR code payload MUST be a string
  if (typeof uri !== "string") {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message: "The payload of the QR Code MUST be a string",
        section: "4.3",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
  }
  // Section 4.4
  // Parse the form of QR Code payload
  const payloadRegex = /(NZCP:\/)(\d+)\/([A-Za-z2-7=]+)/;
  const payloadMatch = uri.match(payloadRegex);
  if (!payloadMatch) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "The payload of the QR Code MUST be in the form `NZCP:/<version-identifier>/<base32-encoded-CWT>`",
        section: "4.4",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
  }

  const [_match, payloadPrefix, versionIdentifier, base32EncodedCWT] =
    payloadMatch;

  // Section 4.5
  // Check if the payload received from the QR Code begins with the prefix NZCP:/, if it does not then fail.
  if (payloadPrefix !== "NZCP:/") {
    return {
      success: false,
      credentialSubject: null,
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
      credentialSubject: null,
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
  let uint8array: Uint8Array;
  try {
    uint8array = base32.parse(
      // from https://nzcp.covid19.health.nz/#2d-barcode-encoding
      // Some base32 decoding implementations may fail to decode a base32 string that is missing the required padding as defined by [RFC4648].
      // [addBase32Padding] is a simple javascript snippet designed to show how an implementor can add the required padding to a base32 string.
      addBase32Padding(base32EncodedCWT)
    );
  } catch (error) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message: "The payload of the QR Code MUST be base32 encoded",
        section: "4.7",
        link: "https://nzcp.covid19.health.nz/#2d-barcode-encoding",
      },
    };
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
  const decodedCOSEStructure = decodeCBOR(uint8array);

  // Decoding the byte string present in the first element of the Decoded COSE structure, as a CBOR structure and rendering it via the expanded form yields the following.
  // Let this result be known as the Decoded CWT protected headers.
  // a2                -- Map, 2 pairs
  // 04              -- {Key:0}, 4
  // 45              -- Bytes, length: 5
  //   6b65792d31    -- {Val:0}, 6b65792d31
  // 01              -- {Key:1}, 1
  // 26              -- {Val:1}, -7
  const decodedCWTProtectedHeaders = decodeCBOR(
    decodedCOSEStructure.value[0]
  ) as Map<number, Buffer | number>;

  const cwtHeaders = parseCWTHeaders(decodedCWTProtectedHeaders);

  // Section 7.1
  // https://nzcp.covid19.health.nz/#steps-to-verify-a-new-zealand-covid-pass
  // With the headers returned from the COSE_Sign1 decoding step, check for the presence
  // of the required headers as defined in the data model section, if these conditions are not meet then fail.
  if (cwtHeaders.kid) {
    // pass
  } else {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "`kid` header MUST be present in the protected header section of the `COSE_Sign1` structure",
        section: "2.2.1.1",
        link: "https://nzcp.covid19.health.nz/#cwt-headers",
      },
    };
  }
  if (cwtHeaders.alg === "ES256") {
    // pass
  } else {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "`alg` claim value MUST be present in the protected header section of the `COSE_Sign1` structure and MUST be set to the value corresponding to `ES256` algorithm registration",
        section: "2.2.2.2",
        link: "https://nzcp.covid19.health.nz/#cwt-headers",
      },
    };
  }

  const rawCWTClaims = decodeCBOR(decodedCOSEStructure.value[2]) as Map<
    number | string,
    string | number | Buffer | unknown
  >;

  const cwtClaims = parseCWTClaims(rawCWTClaims);

  const iss = cwtClaims.iss;

  // Section 2.1.0.2.1
  // Issuer claim MUST be present
  if (!iss) {
    return {
      success: false,
      violates: {
        message: "Issuer claim MUST be present",
        section: "2.1.0.2.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      credentialSubject: null,
    };
  }

  // TODO: section number?
  // // Validate that the iss claim in the decoded CWT payload is an issuer you trust refer to the trusted issuers section for a trusted list, if not then fail.
  // are we supporting other issuers?
  if (!trustedIssuers.includes(iss)) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "`iss` value reported in the pass does not match one listed in the trusted issuers",
        link: "https://nzcp.covid19.health.nz/#trusted-issuers",
        section: "6.3",
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

  const didResult = await did.resolve(iss);

  if (didResult.didResolutionMetadata.error) {
    // an error came back from the offical DID reference implementation
    // this handles a bunch of clauses in https://nzcp.covid19.health.nz/#issuer-identifier
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message: didResult.didResolutionMetadata.error,
        link: "https://nzcp.covid19.health.nz/#ref:DID-CORE",
        section: "DID-CORE.1",
      },
    };
  }

  const didDocument = didResult.didDocument;

  const absoluteKeyReference = `${iss}#${cwtHeaders.kid}`;

  // 5.1.1
  // The public key referenced by the decoded CWT MUST be listed/authorized under the assertionMethod verification relationship in the resolved DID document.
  if (!didDocument?.assertionMethod) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "The public key referenced by the decoded CWT MUST be listed/authorized under the assertionMethod verification relationship in the resolved DID document.",
        link: "https://nzcp.covid19.health.nz/#did-document",
        section: "5.1.1",
      },
    };
  }
  let assertionMethod = didDocument.assertionMethod;
  if (typeof assertionMethod === "string") {
    assertionMethod = [assertionMethod];
  }
  if (!assertionMethod.includes(absoluteKeyReference)) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "The public key referenced by the decoded CWT MUST be listed/authorized under the assertionMethod verification relationship in the resolved DID document.",
        link: "https://nzcp.covid19.health.nz/#did-document",
        section: "5.1.1",
      },
    };
  }
  // Not in NZCP spec but implied.. If theres an assertionMethod there should be a matching verification method
  if (!didDocument.verificationMethod) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "No matching verificationMethod method for the assertionMethod",
        link: "https://nzcp.covid19.health.nz/#ref:DID-CORE",
        section: "DID-CORE.2",
      },
    };
  }
  const verificationMethod = didDocument.verificationMethod.find(
    (v) => v.id === absoluteKeyReference
  );
  if (!verificationMethod) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message: "No matching verificationMethod for the assertionMethod",
        link: "https://nzcp.covid19.health.nz/#ref:DID-CORE",
        section: "DID-CORE.2",
      },
    };
  }

  const publicKeyJwk = verificationMethod?.publicKeyJwk;

  // 5.1.2 (Note: Spec is written pretty hard to code against here... trying todo by best, could probably build the PK here?)
  // The public key referenced by the decoded CWT MUST be a valid P-256 public key suitable for usage with the
  // Elliptic Curve Digital Signature Algorithm (ECDSA) as defined in (ISO/IEC 14888–3:2006) section 2.3.

  if (!publicKeyJwk || !publicKeyJwk?.x || !publicKeyJwk?.y) {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "The public key referenced by the decoded CWT MUST be a valid P-256 public key",
        link: "https://nzcp.covid19.health.nz/#did-document",
        section: "5.1.2",
      },
    };
  }

  // 5.1.3 TODO: check that publicKeyJwt is a valid JWK
  // The expression of the public key referenced by the decoded CWT MUST be in the form of a JWK as per [RFC7517].
  if (verificationMethod?.type !== "JsonWebKey2020") {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "The expression of the public key referenced by the decoded CWT MUST be in the form of a JWK as per [RFC7517].",
        link: "https://nzcp.covid19.health.nz/#did-document",
        section: "5.1.3",
      },
    };
  }

  // TODO: 5.1.4 (Note: Seems more of a spec for a signer rather than a verifier... will do later)
  // This public key JWK expression MUST NOT publish any JSON Web Key Parameters that are classified as “Private” under the “Parameter Information Class” category of the JSON Web Key Parameters IANA registry.

  // 5.1.5
  // This public key JWK expression MUST set a crv property which has a value of P-256. Additionally, the JWK MUST have a kty property set to EC.

  if (publicKeyJwk.crv !== "P-256" || publicKeyJwk.kty !== "EC") {
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "This public key JWK expression MUST set a crv property which has a value of P-256. Additionally, the JWK MUST have a kty property set to EC.",
        link: "https://nzcp.covid19.health.nz/#did-document",
        section: "5.1.5",
      },
    };
  }

  // From section 3 "New Zealand COVID Passes MUST use Elliptic Curve Digital Signature Algorithm"
  // this is hardcoded in validateCOSESignature

  // From section 3 "all New Zealand COVID Passes MUST use the COSE_Sign1 structure"
  // this structure is hardcoded in validateCOSESignature

  const result = validateCOSESignature(decodedCOSEStructure, publicKeyJwk);

  if (!result) {
    // exact wording is: "Verifying parties MUST validate the digital signature on a New Zealand COVID Pass and MUST reject passes that fail this check as being invalid."
    return {
      success: false,
      credentialSubject: null,
      violates: {
        message:
          "Retrieved public key does not validate `COSE_Sign1` structure",
        link: "https://nzcp.covid19.health.nz/#cryptographic-digital-signature-algorithm-selection",
        section: "3",
      },
    };
  }

  // TODO: section number?
  // With the payload returned from the COSE_Sign1 decoding, check if it is a valid CWT containing the claims defined in the data model section, if these conditions are not meet then fail.
  const cwtClaimsResult = validateCWTClaims(cwtClaims);
  if (!cwtClaimsResult.success) {
    return {
      ...cwtClaimsResult,
      credentialSubject: null,
    };
  }

  return {
    success: result,
    violates: null,
    credentialSubject: cwtClaimsResult.cwtClaims.vc.credentialSubject,
  };
};
