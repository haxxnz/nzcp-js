import {
  RawCWTClaims,
  RawCWTHeaders,
  UnvalidatedCWTClaims,
  UnvalidatedCWTHeaders,
  VC,
} from "./cwtTypes";
import { CWTClaimsResult } from "./generalTypes";
import { decodeCtiToJti } from "./jtiCti";
import { currentTimestamp } from "./util";

export function parseCWTClaims(
  rawCWTClaims: RawCWTClaims
): UnvalidatedCWTClaims {
  // Section 2.1.0.1.5
  // The claim key for cti of 7 MUST be used
  const ctiClaimRaw = rawCWTClaims.get(7);
  let jti: string | undefined;
  if (ctiClaimRaw && ctiClaimRaw instanceof Buffer) {
    // Section 2.1.1.2
    // CWT Token ID claim MUST be a valid UUID in the form of a URI as specified by [RFC4122]
    const jtiResult = decodeCtiToJti(ctiClaimRaw);
    if (jtiResult.success) {
      jti = jtiResult.jti;
    }
  }

  // Section 2.1.0.2.5
  // The claim key for iss of 1 MUST be used
  const issClaimRaw = rawCWTClaims.get(1);
  let iss: string | undefined;
  if (issClaimRaw && typeof issClaimRaw === "string") {
    iss = issClaimRaw.toString();
  }

  // Section 2.1.0.3.5
  // The claim key for nbf of 5 MUST be used
  const nbfClaimRaw = rawCWTClaims.get(5);
  let nbf: number | undefined;
  if (nbfClaimRaw) {
    if (typeof nbfClaimRaw === "number") {
      nbf = nbfClaimRaw;
    }
  }

  // Section 2.1.0.4.5
  // The claim key for exp of 4 MUST be used
  const expClaimRaw = rawCWTClaims.get(4);
  let exp: number | undefined;
  if (expClaimRaw) {
    if (typeof expClaimRaw === "number") {
      exp = expClaimRaw;
    }
  }

  // Section 2.1.0.5.3
  // The vc claim is currrently unregistered and therefore MUST be encoded as a Major Type 3 string as defined by [RFC7049].
  // That is automatically handled by CBOR library.
  const vcClaimRaw = rawCWTClaims.get("vc");
  let vc: VC | undefined;
  if (vcClaimRaw) {
    vc = vcClaimRaw as VC;
  }

  return { jti, iss, nbf, exp, vc };
}

// parse CWT claims
// https://nzcp.covid19.health.nz/#cwt-claims
export function validateCWTClaims(
  cwtClaims: UnvalidatedCWTClaims
): CWTClaimsResult {
  // Section 2.1.0.1.5
  // The claim key for cti of 7 MUST be used
  if (cwtClaims.jti) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message: "CWT Token ID claim MUST be present",
        section: "2.1.0.1.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // Section 2.1.0.2.5
  // The claim key for iss of 1 MUST be used
  if (cwtClaims.iss) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message: "Issuer claim MUST be present",
        section: "2.1.0.2.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }
  // Section 2.1.0.3.5
  // The claim key for nbf of 5 MUST be used
  if (cwtClaims.nbf) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message:
          "Not Before claim MUST be present and MUST be a timestamp encoded as an integer in the NumericDate format (as specified in [RFC8392] section 2)",
        section: "2.1.0.3.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // Section 2.1.0.4.5
  // The claim key for exp of 4 MUST be used
  if (cwtClaims.exp) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message:
          "Not Before claim MUST be present and MUST be a timestamp encoded as an integer in the NumericDate format (as specified in [RFC8392] section 2)",
        section: "2.1.0.4.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // TODO: what section number?
  if (currentTimestamp() >= cwtClaims.nbf) {
    // pass
  } else {
    return {
      success: false,
      cwtClaims: null,
      violates: {
        message:
          "The current datetime is after or equal to the value of the `nbf` claim",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
        section: "2.1.0.3.3",
      },
    };
  }

  // TODO: what section number?
  if (currentTimestamp() < cwtClaims.exp) {
    // pass
  } else {
    return {
      success: false,
      cwtClaims: null,
      violates: {
        message: "The current datetime is before the value of the `exp` claim",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
        section: "2.1.0.4.3",
      },
    };
  }

  // Section 2.1.0.5.3
  // The vc claim is currrently unregistered and therefore MUST be encoded as a Major Type 3 string as defined by [RFC7049].
  if (cwtClaims.vc) {
    // pass
  } else {
    return {
      success: false,
      violates: {
        message: "Verifiable Credential CWT claim MUST be present",
        section: "2.1.0.5.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtClaims: null,
    };
  }

  // https://nzcp.covid19.health.nz/#verifiable-credential-claim-structure
  if (
    // Section 2.3.2.1
    // This property MUST be present and its value MUST be an array of strings
    cwtClaims.vc["@context"] instanceof Array &&
    // Section 2.3.2.3
    // The first value MUST equal `https://www.w3.org/2018/credentials/v1`
    cwtClaims.vc["@context"][0] === "https://www.w3.org/2018/credentials/v1" &&
    // Section 2.3.3-2.3.4
    // The following is an example including an additional JSON-LD context entry that defines the additional vocabulary specific to the New Zealand COVID Pass.
    cwtClaims.vc["@context"][1] === "https://nzcp.covid19.health.nz/contexts/v1"
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
    cwtClaims.vc.type instanceof Array &&
    // Section 2.3.5.2
    // Whose first element is VerifiableCredential and second element corresponds to one defined in the pass types section
    cwtClaims.vc.type[0] === "VerifiableCredential" &&
    // Section 2.4.3
    // https://nzcp.covid19.health.nz/#pass-types
    // For the purposes of the New Zealand COVID Pass the Verifiable Credential MUST also include one of the following types.
    // - PublicCovidPass
    cwtClaims.vc.type[1] === "PublicCovidPass"
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
  if (cwtClaims.vc.version === "1.0.0") {
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
  if (cwtClaims.vc.credentialSubject) {
    // and its value MUST be a JSON object with properties determined by the declared pass type for the pass
    if (!cwtClaims.vc.credentialSubject.givenName) {
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
    if (!cwtClaims.vc.credentialSubject.dob) {
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
    cwtClaims: {
      jti: cwtClaims.jti,
      iss: cwtClaims.iss,
      nbf: cwtClaims.nbf,
      exp: cwtClaims.exp,
      vc: cwtClaims.vc,
    },
    violates: null,
  };
}

// Section 2.2
// CWT Headers
// https://nzcp.covid19.health.nz/#cwt-headers
export function parseCWTHeaders(
  rawCWTHeaders: RawCWTHeaders
): UnvalidatedCWTHeaders {
  // Section 2.2.1
  // The claim key of 4 is used to identify `kid` claim
  const CWTHeaderKid = rawCWTHeaders.get(4);
  // Section 2.2.2
  // The claim key of 1 is used to identify `alg` claim
  const CWTHeaderAlg = rawCWTHeaders.get(1);
  // Section 2.2.1
  // `kid` value MUST be encoded as a Major Type 3
  const kid = CWTHeaderKid ? CWTHeaderKid.toString() : undefined;
  // Section 2.2.2
  // `alg` claim value MUST be set to the value corresponding to ES256 algorithm registration, which is the numeric value of -7
  const alg = CWTHeaderAlg === -7 ? "ES256" : undefined;
  return { kid, alg };
}
