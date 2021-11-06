# NZCP.js
 
A verification library for COVID-19 Vaccine Certificates in New Zealand built on top of the [NZ Covid Pass Spec](https://github.com/minhealthnz/nzcovidpass-spec) provided by the Ministry of Health. All contributions welcome 🥳


* [TypeScript 4](https://www.typescriptlang.org/)
* Optionally [esbuild](https://esbuild.github.io/) to bundle for browsers (and Node.js)
* Linting with [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) ([tslint](https://palantir.github.io/tslint/) is deprecated)
* Testing with [Jest](https://jestjs.io/docs/getting-started) (and [ts-jest](https://www.npmjs.com/package/ts-jest))
* Publishing to npm
* Continuous integration ([GitHub Actions](https://docs.github.com/en/actions) / [GitLab CI](https://docs.gitlab.com/ee/ci/))
* Automatic API documentation with [TypeDoc](https://typedoc.org/guides/doccomments/)

See also the introduction blog post: **[Starting a TypeScript Project in 2021](https://www.metachris.com/2021/03/bootstrapping-a-typescript-node.js-project/)**.


## Getting Started

```bash

# Install dependencies
yarn install

# Now you can run various yarn commands:
yarn cli
yarn lint
yarn test
yarn build-all
yarn ts-node <filename>
yarn esbuild-browser
...
```




