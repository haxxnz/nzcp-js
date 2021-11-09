# NZCP.js

A JavaScript implementation of [NZ COVID Pass](https://github.com/minhealthnz/nzcovidpass-spec) verification, New Zealand's proof of COVID-19 vaccination solution, written in TypeScript. All contributions welcome 🥳

We also have a [Rust implementation](https://github.com/vaxxnz/nzcp-rust/) available.

> This library can be used for both Client and Server-side implementations.

## Install

```bash
# NPM
npm i @vaxxnz/nzcp

# Yarn
yarn add @vaxxnz/nzcp
```

## Usage

```javascript
import { verifyPass } from "@vaxxnz/nzcp";

// Verify a New Zealand COVID-19 Pass
const result = await verifyPass("NZCP:/1/2KCEVIQEIVVWK6...");
```

### Successful Verification

On **successful** verification of the given pass, the `verifyPass` method returns the following result:

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

On **unsuccessful** verification of the given pass, the `verifyPass` method returns the following result:

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

## Support

See something that can be improved? [Report an Issue](https://github.com/vaxxnz/nzcp-js/issues) or contact us to [report a security concern](mailto:info@vaxx.nz).

Want to help us build a better library? We welcome contributions via [pull requests](https://github.com/vaxxnz/nzcp-js/pulls) and welcome you to our wider [Vaxx.nz](https://vaxx.nz) community on Discord: [Join our Discord community](https://discord.gg/sJWmNy7wnM).

---

## Contribute

```bash
# Install dependencies
yarn install
```
```bash
# Use developer scripts
yarn lint
yarn test
yarn test-watch
yarn build-all
```
