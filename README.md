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

```javascript
import { verifyPassURI } from "@vaxxnz/nzcp";

// Verify a New Zealand COVID-19 Pass
const result = await verifyPassURI("NZCP:/1/2KCEVIQEIVVWK6...");
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


### Verifying example COVID Passes

To verify [example COVID Passes from the spec](https://nzcp.covid19.health.nz/#valid-worked-example), use `verifyPassURIWithTrustedIssuers` with the following parameters:

```javascript
import { verifyPassURIWithTrustedIssuers } from "@vaxxnz/nzcp";

// An array of trusted issuers for the example COVID Passes
const nzcpTrustedIssuers = ["did:web:nzcp.covid19.health.nz"];

const result = await verifyPassURIWithTrustedIssuers(
  "NZCP:/1/2KCEVIQEIVVWK6...", // COVID-19 Pass to be verified
  nzcpTrustedIssuers // Array of trusted issuers
);
```

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
