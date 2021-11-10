import { Resolver } from "did-resolver";
import { getResolver } from "web-did-resolver";

const webResolver = getResolver();

const didResolver = new Resolver({
  ...webResolver,
});

test("CBOR library works", async () => {
  const doc = await didResolver.resolve("did:web:nzcp.covid19.health.nz");
  expect(doc).toBeTruthy();
  expect(doc.didDocument).toBeTruthy();
  expect(doc.didDocument?.id).toBe("did:web:nzcp.covid19.health.nz");
  expect(doc.didDocumentMetadata).toBeTruthy();
  expect(doc.didResolutionMetadata).toBeTruthy();
});
