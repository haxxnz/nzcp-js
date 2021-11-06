import { Resolver, DIDResolutionResult } from "did-resolver";
import { getResolver } from "web-did-resolver";

const webResolver = getResolver();

const didResolver = new Resolver({
  ...webResolver,
  //...you can flatten multiple resolver methods into the Resolver
});

async function resolve(did: string): Promise<DIDResolutionResult> {
  const doc = await didResolver.resolve(did);
  return doc;
}

export default { resolve };
