# NZCP.js &emsp; [![latest version badge]][npm] [![license badge]][license] [![downloads badge]][npm]

[latest version badge]: https://img.shields.io/npm/v/@vaxxnz/nzcp
[license badge]: https://img.shields.io/npm/l/@vaxxnz/nzcp
[downloads badge]: https://img.shields.io/npm/dw/@vaxxnz/nzcp
[npm]: https://www.npmjs.com/package/@vaxxnz/nzcp
[license]: https://github.com/vaxxnz/nzcp-js/blob/main/LICENSE

A JavaScript implementation of [NZ COVID Pass](https://github.com/minhealthnz/nzcovidpass-spec) verification, New Zealand's proof of COVID-19 vaccination solution, written in TypeScript. All contributions welcome 🥳

We also have a [Rust implementation](https://github.com/vaxxnz/nzcp-rust/) available.

> This library can be used for both in browser and Node.js.

## Install

```bash
# NPM
npm i @vaxxnz/nzcp

# Yarn
yarn add @vaxxnz/nzcp
```

## Demo

- [Node.js demo on REPL.it](https://replit.com/@noway1/NZCPjs-demo)
- [React.js demo on CodeSandbox](https://codesandbox.io/s/nzcpjs-demo-4vjgb)

## Usage

### Online

```javascript
import { verifyPassURI } from "@vaxxnz/nzcp";

// Verify a New Zealand COVID-19 Pass, resolving the latest DID document according to the NZCP-spec
const result = await verifyPassURI("NZCP:/1/2KCEVIQEIVVWK6...");
```

### Offline

```javascript
import { verifyPassURI } from "@vaxxnz/nzcp";

// Verify a New Zealand COVID-19 Pass, using a cached DID document from https://nzcp.identity.health.nz/.well-known/did.json
const result = verifyPassUriOffline("NZCP:/1/2KCEVIQEIVVWK6...");
```

### Successful Verification

On **successful** verification of the given pass, the `verifyPassURI` method returns the following result:

```javascript
{
  "success": true,            // Verification Outcome
  "violates": null,           // Error object if code is invalid
  "credentialSubject": {      // Pass holder's details
    "givenName": "Emily",     // Pass holder's given name
    "familyName": "Example",  // Pass holder's family name
    "dob": "01/01/1970"       // Pass holder's date of birth
  }
}
```

### Unsuccessful Verification

On **unsuccessful** verification of the given pass, the `verifyPassURI` method returns the following result:

```javascript
{
  "success": false,           // Verification Outcome
  "violates": {               // Error information
    "message": "Error..",     // Friendly Error Message
    "section": "0.0",         // Section of official specs under violation
    "link": "https://..",     // Link to specifications breached
  },
  "credentialSubject": null   // No pass holder data due to error
}
```


### Advanced Usage

These example show how to configure the library to supplier your own trusted issuers or DID documents. This will allow you to use the library with the [example COVID Passes from the spec](https://nzcp.covid19.health.nz/#valid-worked-example).


The following example shows how to use the example trusted issuer for online verification:

```javascript
import { verifyPassURI, TRUSTED_ISSUERS } from "@vaxxnz/nzcp";

// Trusted issuer for the example COVID Passes
const exampleTrustedIssuer = TRUSTED_ISSUERS.MOH_EXAMPLE; // "did:web:nzcp.covid19.health.nz"

// Alternatively you could supply a trusted issuer yourself
// Passing in the live trusted issuer is the default behavior
const liveTrustedIssuer = TRUSTED_ISSUERS.MOH_LIVE;       // "did:web:nzcp.identity.health.nz"

const result = await verifyPassURI(
  "NZCP:/1/2KCEVIQEIVVWK6...",            // COVID-19 Pass to be verified
  { trustedIssuer: exampleTrustedIssuer } // Supply your own trusted issuer to overwrite the default
);
```

The following example shows how use the example DID document for offline verification:

```javascript
import { verifyPassURIOffline, DID_DOCUMENTS } from "@vaxxnz/nzcp";

// DID Document for the example COVID Passes
const exampleDIDDocument = DID_DOCUMENTS.MOH_EXAMPLE;   // Hard coded from https://nzcp.covid19.health.nz/.well-known/did.json

// Alternatively you could supply a DID document yourself
// Passing in the live DID Document is the default behavior
const liveTrustedIssuer = DID_DOCUMENTS.MOH_LIVE;       // Hard coded from https://nzcp.identity.health.nz/.well-known/did.json

const result = verifyPassURIOffline(
  "NZCP:/1/2KCEVIQEIVVWK6...",          // COVID-19 Pass to be verified
  { didDocument: exampleDIDDocument }   // Supply your own DID document to overwrite the default
);
```

## Online VS Offline

Currently for NodeJS/React Native project we recomend using `verifyPassURI` and for browser based application to use `verifyPassURIOffline`.

The difference between the `verifyPassURI` and `verifyPassURIOffline` interfaces is:
 - `verifyPassURI`: This will resolve the DID document (which contains the Ministry of Health public key) from the web according to https://nzcp.covid19.health.nz/#ref:DID-CORE and then validate the DID document is from the MoH trusted issuer.
 - `verifyPassURIOffline`: This will use a prefetched version of https://nzcp.identity.health.nz/.well-known/did.json to verify against

There is a CORS policy on https://nzcp.identity.health.nz/.well-known/did.json which makes it currently unable to be fetched from the browser. The only option for browser based verifiers is currently to use the `verifyPassURIOffline` function. The Ministry Of Health is aware of this issue and is working to resolve it.

Offline scanners or scanners opperating in poor network conditions will also need to use `verifyPassURIOffline`. Since `verifyPassURI` requires a internet connection to resolve the DID document.

NZCP-JS has decided to support both use cases but which one to use is a decision that a user of this library is best position to make. If you have a network connection and want to be completely correct (and to specification) use `verifyPassURI`. If you want speed, don't have a network connection or don't mind using a cached DID document, use `verifyPassURIOffline`.

If you want to supply your own trusted issuer or DID document parameters, you can follow the Advanced Usage guide above.

## Support

See something that can be improved? [Report an Issue](https://github.com/vaxxnz/nzcp-js/issues) or contact us to [report a security concern](mailto:info@vaxx.nz).

Want to help us build a better library? We welcome contributions via [pull requests](https://github.com/vaxxnz/nzcp-js/pulls) and welcome you to our wider [Vaxx.nz](https://vaxx.nz) community on Discord: [Join our Discord community](https://discord.gg/nkbnqhR8A8).

---

## NPM

[@vaxxnz/nzcp](https://www.npmjs.com/package/@vaxxnz/nzcp)

## Contribute

```bash
# Install dependencies
yarn install
```

```bash
# Use developer scripts
yarn lint
yarn build-all
```

## Run tests
- Create `.env` in the root directory of the project
  - see `.env.example` for an example.
- Run `yarn test` or `yarn test-watch`
