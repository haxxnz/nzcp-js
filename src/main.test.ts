import { DID_DOCUMENTS, TRUSTED_ISSUERS, verifyPassURI, verifyPassURIOffline } from "./main";
import dotenv from "dotenv";

// DID document which works with the example passes specified in v1 of NZ COVID Pass - Technical Specification
// https://nzcp.covid19.health.nz/.well-known/did.json
import exampleDIDDocument from "./exampleDIDDocument.json";

// DID document which works with the live passes specified in v1 of NZ COVID Pass - Technical Specification
// https://nzcp.identity.health.nz/.well-known/did.json
import liveDIDDocument from "./liveDIDDocument.json";

dotenv.config();

// This is the list of trusted issuers which works with the example passes specified in v1 of NZ COVID Pass - Technical Specification
// https://nzcp.covid19.health.nz/
const exampleTrustedIssuers = ["did:web:nzcp.covid19.health.nz"];

// https://nzcp.covid19.health.nz/#valid-worked-example
const EXAMPLE_PASS =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVAYFE6VGU4MCDGK7DHLLYWHVPUS2YIDJOA6Y524TD3AZRM263WTY2BE4DPKIF27WKF3UDNNVSVWRDYIYVJ65IRJJJ6Z25M2DO4YZLBHWFQGVQR5ZLIWEQJOZTS3IQ7JTNCFDX";
test("Valid pass is successful", async () => {
  const result = await verifyPassURI(EXAMPLE_PASS, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(true);
  expect(result.credentialSubject?.givenName).toBe("Jack");
  expect(result.credentialSubject?.familyName).toBe("Sparrow");
  expect(result.credentialSubject?.dob).toBe("1960-04-16");
});

// https://nzcp.covid19.health.nz/#bad-public-key
const badPublicKeyPass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVAY73U6TCQ3KF5KFML5LRCS5D3PCYIB2D3EOIIZRPXPUA2OR3NIYCBMGYRZUMBNBDMIA5BUOZKVOMSVFS246AMU7ADZXWBYP7N4QSKNQ4TETIF4VIRGLHOXWYMR4HGQ7KYHHU";
test("Bad Public Key pass is unsuccessful", async () => {
  const result = await verifyPassURI(badPublicKeyPass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("3");
});

// https://nzcp.covid19.health.nz/#public-key-not-found
const publicKeyNotFoundPass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGIASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVBMP3LEDMB4CLBS2I7IOYJZW46U2YIBCSOFZMQADVQGM3JKJBLCY7ATASDTUYWIP4RX3SH3IFBJ3QWPQ7FJE6RNT5MU3JHCCGKJISOLIMY3OWH5H5JFUEZKBF27OMB37H5AHF";
test("Public Key Not Found pass is unsuccessful", async () => {
  const result = await verifyPassURI(publicKeyNotFoundPass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("5.1.1");
});

// https://nzcp.covid19.health.nz/#modified-signature
const modifiedSignaturePass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVAYFE6VGU4MCDGK7DHLLYWHVPUS2YIAAAAAAAAAAAAAAAAC63WTY2BE4DPKIF27WKF3UDNNVSVWRDYIYVJ65IRJJJ6Z25M2DO4YZLBHWFQGVQR5ZLIWEQJOZTS3IQ7JTNCFDX";
test("Modified Signature pass is unsuccessful", async () => {
  const result = await verifyPassURI(modifiedSignaturePass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("3");
});

// https://nzcp.covid19.health.nz/#modified-payload
const modifiedPayloadPass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEOKKALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWKU3UMV3GK2TGMFWWS3DZJZQW2ZLDIRXWKY3EN5RGUMJZGYYC2MBUFUYTMB2QMCSPKTKOGBBTFPRTVV4LD2X2JNMEAAAAAAAAAAAAAAAABPN3J4NASOBXVEC5P3FC52BWW2ZK3IR4EMKU7OUIUUU7M5OWNBXOMMVQT3CYDKYI64VULCIEXMZZNUIPUZWRCR3Q";
test("Modified Payload pass is unsuccessful", async () => {
  const result = await verifyPassURI(modifiedPayloadPass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("3");
});

// https://nzcp.covid19.health.nz/#expired-pass
const expiredPass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUX5AM2FQIGTBPBPYWYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVA56TNJCCUN2NVK5NGAYOZ6VIWACYIBM3QXW7SLCMD2WTJ3GSEI5JH7RXAEURGATOHAHXC2O6BEJKBSVI25ICTBR5SFYUDSVLB2F6SJ63LWJ6Z3FWNHOXF6A2QLJNUFRQNTRU";
test("Expired Pass is unsuccessful", async () => {
  const result = await verifyPassURI(expiredPass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("2.1.0.4.3");
});

// https://nzcp.covid19.health.nz/#not-active-pass
const notActivePass =
  "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRU2XI5UFQIGTMZIQIWYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVA27NR3GFF4CCGWF66QGMJSJIF3KYID3KTKCBUOIKIC6VZ3SEGTGM3N2JTWKGDBAPLSG76Q3MXIDJRMNLETOKAUTSBOPVQEQAX25MF77RV6QVTTSCV2ZY2VMN7FATRGO3JATR";
test("Not Active pass is unsuccessful", async () => {
  const result = await verifyPassURI(notActivePass, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("2.1.0.3.3");
});

// Custom Test: non base-32 string in the payload
const notBase32 =
  "NZCP:/1/asdfghasSDFGHFDSADFGHFDSADFGHGFSDADFGBHFSADFGHFDSFGHFDDS0123456789";
test("Non base-32 string in the payload Pass is unsuccessful", async () => {
  const result = await verifyPassURI(notBase32, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("4.7");
});

// Custom Test: not a string
test("Non string uri unsuccesful", async () => {
  const result = await verifyPassURI(undefined as unknown as string, {
    trustedIssuer: exampleTrustedIssuers,
  });
  expect(result.success).toBe(false);
  expect(result.violates?.section).toBe("4.3");
});

// Custom Test: BYO DID document
test("Valid pass is successful with BYO DID document", async () => {
  const result = await verifyPassURIOffline(
    EXAMPLE_PASS,
    { trustedIssuer: exampleTrustedIssuers, didDocument: exampleDIDDocument }
  );
  expect(result.success).toBe(true);
  expect(result.credentialSubject?.givenName).toBe("Jack");
  expect(result.credentialSubject?.familyName).toBe("Sparrow");
  expect(result.credentialSubject?.dob).toBe("1960-04-16");
});
const LIVE_PASS = process.env.LIVE_COVID_PASS_URI as string

// Custom Test: Live pass
test("Live pass is successful", async () => {
  const result = await verifyPassURI(LIVE_PASS);
  expect(result.success).toBe(true);
});

// Custom Test: Live pass with BYO DID document
test("Live pass is successful with BYO DID document", async () => {
  const result = await verifyPassURIOffline(
    LIVE_PASS,
    { didDocument: liveDIDDocument }
  );
  expect(result.success).toBe(true);
});


test("Standard usage, resolves DID document, resolves according to spec", async () => {
  const result = await verifyPassURI(LIVE_PASS);
  expect(result.success).toBe(true)
})

test("Standard usage, resolves DID document, resolves according to spec. empty optionns", async () => {
  const result = await verifyPassURI(LIVE_PASS, {});
  expect(result.success).toBe(true)
})

test("Standard usage, resolves DID document, resolves according to spec. bad pass", async () => {
  const result = await verifyPassURI(EXAMPLE_PASS);
  expect(result.success).toBe(false)
})

test("Standard usage, resolves DID document (same as previous call", async () => {
  const result = await verifyPassURI(LIVE_PASS, { trustedIssuer: TRUSTED_ISSUERS.MOH_LIVE });
  expect(result.success).toBe(true)
})

test("Standard usage, resolves DID document (same as previous call. bad pass", async () => {
  const result = await verifyPassURI(EXAMPLE_PASS, { trustedIssuer: TRUSTED_ISSUERS.MOH_LIVE });
  expect(result.success).toBe(false)
})

test("Standard usage, resolves DID document, use MoH test issuer", async () => {
  const result = await verifyPassURI(EXAMPLE_PASS, { trustedIssuer: TRUSTED_ISSUERS.MOH_EXAMPLE });
  expect(result.success).toBe(true)
})

test("Standard usage, resolves DID document, pass your own trusted issuers to be string|string[]", async () => {
  const result = await verifyPassURI(LIVE_PASS, { trustedIssuer: [TRUSTED_ISSUERS.MOH_LIVE] });
  expect(result.success).toBe(true)
})

test("Standard usage, resolves DID document, allowed trustedIssuer to be string|string[]", async () => {
  const result = await verifyPassURI(EXAMPLE_PASS, { trustedIssuer: [TRUSTED_ISSUERS.MOH_EXAMPLE] });
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document", () => {
  const result = verifyPassURIOffline(LIVE_PASS);
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document. empty options", () => {
  const result = verifyPassURIOffline(LIVE_PASS, {});
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document. bad pass", () => {
  const result = verifyPassURIOffline(EXAMPLE_PASS);
  expect(result.success).toBe(false)
})

test("offline usage, use hard coded DID document (same as the previous call)", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: DID_DOCUMENTS.MOH_LIVE });
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document, use MoH test DID document", () => {
  const result = verifyPassURIOffline(EXAMPLE_PASS, { didDocument: DID_DOCUMENTS.MOH_EXAMPLE });
  expect(result.success).toBe(true)
})

test("offline usage, pass your own DID document (needs a different interface since it won't resolve a promise) to be string|string[]", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: [DID_DOCUMENTS.MOH_LIVE] });
  expect(result.success).toBe(true)
})

test("offline usage, pass your own DID document, allow didDocument to be string|string[]", () => {
  const result = verifyPassURIOffline(EXAMPLE_PASS, { didDocument: [DID_DOCUMENTS.MOH_EXAMPLE] });
  expect(result.success).toBe(true)
})


test("offline usage, use hard coded DID document (same as the previous call). with trusted issuer", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: DID_DOCUMENTS.MOH_LIVE, trustedIssuer: TRUSTED_ISSUERS.MOH_LIVE });
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document (same as the previous call). with wrong trusted issuer", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: DID_DOCUMENTS.MOH_LIVE, trustedIssuer: TRUSTED_ISSUERS.MOH_EXAMPLE });
  expect(result.success).toBe(false)
})


test("offline usage, use hard coded DID document (same as the previous call). with trusted issuer array ", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: DID_DOCUMENTS.MOH_LIVE, trustedIssuer: [TRUSTED_ISSUERS.MOH_LIVE] });
  expect(result.success).toBe(true)
})

test("offline usage, use hard coded DID document (same as the previous call). with wrong trusted issuer array", () => {
  const result = verifyPassURIOffline(LIVE_PASS, { didDocument: DID_DOCUMENTS.MOH_LIVE, trustedIssuer: [TRUSTED_ISSUERS.MOH_EXAMPLE] });
  expect(result.success).toBe(false)
})

