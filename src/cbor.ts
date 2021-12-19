// centralized place where cbor is included, in case we need to patch it

import { Buffer } from "buffer";

import process from "process";
global.process = process;

import util from "util";
// @ts-ignore
global.TextDecoder = util.TextDecoder;
// @ts-ignore
global.TextEncoder = util.TextEncoder;

import cbor from "cbor";

export const encodeOneCBOR = (obj: any): Buffer => {
  return cbor.encodeOne(obj, { genTypes: [Buffer, cbor.Encoder._pushBuffer] });
};

export const decodeCBOR = (buf: Buffer | Uint8Array): any => {
  return cbor.decode(buf);
};
