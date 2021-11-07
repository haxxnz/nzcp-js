import { VC } from "./cwtPayloadTypes";
import { CWTClaimsResult } from "./generalTypes";

type RawCWTPayload = Map<number | string, string | number | Buffer | unknown>;

// parse CWT claims
// https://nzcp.covid19.health.nz/#cwt-claims
export function parseCWTClaims(rawCWTPayload: RawCWTPayload): CWTClaimsResult {
  // Section 2.1.1.5
  // The claim key for cti of 7 MUST be used
  const ctiClaimRaw = rawCWTPayload.get(7);
  let jti: string;
  if (ctiClaimRaw && ctiClaimRaw instanceof Buffer) {
    const hexUuid = ctiClaimRaw.toString("hex");
    // Section 2.1.1.2
    // CWT Token ID claim MUST be a valid UUID in the form of a URI as specified by [RFC4122]
    // TODO: split out to a separate function https://nzcp.covid19.health.nz/#mapping-jti-cti
    jti = `urn:uuid:${hexUuid.slice(0, 8)}-${hexUuid.slice(
      8,
      12
    )}-${hexUuid.slice(12, 16)}-${hexUuid.slice(16, 20)}-${hexUuid.slice(
      20,
      32
    )}`;
  } else {
    return {
      success: false,
      violates: {
        message: "CWT Token ID claim MUST be present",
        section: "2.1.1.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // Section 2.1.2.5
  // The claim key for iss of 1 MUST be used
  const issClaimRaw = rawCWTPayload.get(1);
  let iss: string;
  if (issClaimRaw && typeof issClaimRaw === "string") {
    iss = issClaimRaw.toString();
  } else {
    return {
      success: false,
      violates: {
        message: "Issuer claim MUST be present",
        section: "2.1.2.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }
  // Section 2.1.3.5
  // The claim key for nbf of 5 MUST be used
  const nbfClaimRaw = rawCWTPayload.get(5);
  let nbf: number;
  if (nbfClaimRaw) {
    if (typeof nbfClaimRaw === "number") {
      nbf = nbfClaimRaw;
    } else {
      return {
        success: false,
        violates: {
          message:
            "Not Before claim MUST be a timestamp encoded as an integer in the NumericDate format (as specified in [RFC8392] section 2)",
          section: "2.1.3.2",
          link: "https://nzcp.covid19.health.nz/#cwt-claims",
        },
        cwtClaims: null,
      };
    }
  } else {
    return {
      success: false,
      violates: {
        message: "Not Before claim MUST be present",
        section: "2.1.3.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // Section 2.1.4.5
  // The claim key for exp of 4 MUST be used
  const expClaimRaw = rawCWTPayload.get(4);
  let exp: number;
  if (expClaimRaw) {
    if (typeof expClaimRaw === "number") {
      exp = expClaimRaw;
    } else {
      return {
        success: false,
        violates: {
          message:
            "Not Before claim MUST be a timestamp encoded as an integer in the NumericDate format (as specified in [RFC8392] section 2)",
          section: "2.1.4.2",
          link: "https://nzcp.covid19.health.nz/#cwt-claims",
        },
        cwtClaims: null,
      };
    }
  } else {
    return {
      success: false,
      violates: {
        message: "Not Before claim MUST be present",
        section: "2.1.4.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // Section 2.1.5.3
  // The vc claim is currrently unregistered and therefore MUST be encoded as a Major Type 3 string as defined by [RFC7049].
  const vcClaimRaw = rawCWTPayload.get("vc");
  let vc: VC;
  if (vcClaimRaw) {
    vc = vcClaimRaw as VC;
  } else {
    return {
      success: false,
      violates: {
        message: "Verifiable Credential CWT claim MUST be present",
        section: "2.1.5.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // TODO: not sure if verifying this is actually required by the spec?
  // https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure
  if (
    // Section 2.3.2.1
    // This property MUST be present and its value MUST be an array of strings
    vc["@context"] instanceof Array &&
    // Section 2.3.2.3
    // The first value MUST equal `https://www.w3.org/2018/credentials/v1`
    vc["@context"][0] === "https://www.w3.org/2018/credentials/v1" &&
    // Section 2.3.3-2.3.4
    // The following is an example including an additional JSON-LD context entry that defines the additional vocabulary specific to the New Zealand COVID Pass.
    vc["@context"][1] === "https://nzcp.covid19.health.nz/contexts/v1"
  ) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message:
          "Verifiable Credential JSON-LD Context property doesn't conform to New Zealand COVID Pass example",
        link: "https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure",
        section: "2.3.2",
      },
      cwtClaims: null,
    };
  }

  if (
    // Section 2.3.5.1
    // This property MUST be present and its value MUST be an array
    vc.type instanceof Array &&
    // Section 2.3.5.2
    // Whose first element is VerifiableCredential and second element corresponds to one defined in the pass types section
    vc.type[0] === "VerifiableCredential" &&
    // Section 2.4.3
    // https://nzcp.covid19.health.nz/#pass-types
    // For the purposes of the New Zealand COVID Pass the Verifiable Credential MUST also include one of the following types.
    // - PublicCovidPass
    vc.type[1] === "PublicCovidPass"
  ) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message:
          "Verifiable Credential Type property doesn't conform to New Zealand COVID Pass example",
        link: "https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure",
        section: "2.3.5",
      },
      cwtClaims: null,
    };
  }

  // Section 2.3.8
  // Verifiable Credential Version property MUST be 1.0.0
  if (vc.version === "1.0.0") {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message: "Verifiable Credential Version property MUST be 1.0.0",
        link: "https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure",
        section: "2.3.8",
      },
      cwtClaims: null,
    };
  }

  // Section 2.3.9
  // Verifiable Credential Credential Subject property MUST be present
  if (vc.credentialSubject) {
    // and its value MUST be a JSON object with properties determined by the declared pass type for the pass
    if (!vc.credentialSubject.givenName) {
      return {
        success: false,
        violates: {
          message: "Missing REQUIRED 'givenName' in credentialSubject property",
          link: "https://nzcp.covid19.health.nz/#publiccovidpass",
          section: "2.4.1.2.1",
        },
        cwtClaims: null,
      };
    }
    if (!vc.credentialSubject.dob) {
      return {
        success: false,
        violates: {
          message: "Missing REQUIRED 'dob' in credentialSubject property",
          link: "https://nzcp.covid19.health.nz/#publiccovidpass",
          section: "2.4.1.2.2",
        },
        cwtClaims: null,
      };
    }
  } else {
    return {
      success: false,
      violates: {
        message:
          "Verifiable Credential Credential Subject property MUST be present",
        link: "https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure",
        section: "2.3.9",
      },
      cwtClaims: null,
    };
  }

  return {
    success: true,
    cwtClaims: { jti, iss, nbf, exp, vc },
    violates: null,
  };
}
