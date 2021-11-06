import { VC } from "./cwtPayloadTypes";
import { CWTResult } from "./generalTypes";

type RawCWTPayload = Map<number | string, string | number | Buffer | unknown>;

// parse CWT claims
// https://nzcp.covid19.health.nz/#cwt-claims
export function parseCWTClaims(rawCWTPayload: RawCWTPayload): CWTResult {
  // Section 2.1.1.5
  // The claim key for cti of 7 MUST be used
  const ctiClaimRaw = rawCWTPayload.get(7);
  let jti: string;
  if (ctiClaimRaw && ctiClaimRaw instanceof Buffer) {
    const hexUuid = ctiClaimRaw.toString("hex");
    // Section 2.1.1.2
    // CWT Token ID claim MUST be a valid UUID in the form of a URI as specified by [RFC4122]
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
      cwtPayload: undefined,
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
      cwtPayload: undefined,
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
        cwtPayload: undefined,
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
      cwtPayload: undefined,
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
        cwtPayload: undefined,
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
      cwtPayload: undefined,
    };
  }

  // Section 2.1.5.3
  // The vc claim is currrently unregistered and therefore MUST be encoded as a Major Type 3 string as defined by [RFC7049].
  const vcClaimRaw = rawCWTPayload.get("vc");
  let vc: VC;
  if (vcClaimRaw) {
    // TODO: verify vc claim using json-schema or something
    vc = vcClaimRaw as VC;
  } else {
    return {
      success: false,
      violates: {
        message: "Verifiable Credential CWT claim MUST be present",
        section: "2.1.5.1",
        link: "https://nzcp.covid19.health.nz/#cwt-claims",
      },
      cwtPayload: undefined,
    };
  }

  return {
    success: true,
    cwtPayload: { jti, iss, nbf, exp, vc },
    violates: undefined,
  };
}
