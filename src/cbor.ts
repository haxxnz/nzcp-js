// centralized place where cbor is included, in case we need to patch it

import util from 'util';
// @ts-ignore
global.TextDecoder = util.TextDecoder;
// @ts-ignore
global.TextEncoder = util.TextEncoder;

import cbor from "cbor";


export const encodeCBOR = (obj: any): Buffer => {
  return cbor.encode(obj);
}

export const decodeCBOR = (buf: Buffer | Uint8Array): any => {
  return cbor.decode(buf);
}
