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


type Data = string | number | Uint8Array | Data[] | Map<Data, Data> | { [key: string]: Data } | null;

// author: putara
// https://github.com/putara/nzcp/blob/master/verifier.js
class Stream {
  data: Uint8Array;
  ptr: number;
  len: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.ptr = 0;
    this.len = data.length;
  }
  getc() {
    if (this.ptr >= this.len) {
      throw new Error("invalid data");
    }
    return this.data[this.ptr++];
  }
  ungetc() {
    if (this.ptr <= 0) {
      throw new Error("invalid data");
    }
    --this.ptr;
  }
  chop(len: number) {
    if (len < 0) {
      throw new Error("invalid length");
    }
    if (this.ptr + len > this.len) {
      throw new Error("invalid data");
    }
    let out = this.data.subarray(this.ptr, this.ptr + len);
    this.ptr += len;
    return out;
  }
}

// RFC 7049
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decodeCBORStream(stream: Stream) {
  function decodeUint(stream: Stream, v: number) {
    let x = v & 31;
    if (x <= 23) {
      // small
    } else if (x === 24) {
      // 8-bit
      x = stream.getc();
    } else if (x === 25) {
      // 16-bit
      x = stream.getc() << 8;
      x |= stream.getc();
    } else if (x === 26) {
      // 32-bit
      x = stream.getc() << 24;
      x |= stream.getc() << 16;
      x |= stream.getc() << 8;
      x |= stream.getc();
    } else if (x === 27) {
      // 64-bit
      x = stream.getc() << 56;
      x |= stream.getc() << 48;
      x |= stream.getc() << 40;
      x |= stream.getc() << 32;
      x |= stream.getc() << 24;
      x |= stream.getc() << 16;
      x |= stream.getc() << 8;
      x |= stream.getc();
    } else {
      throw new Error("invalid data");
    }
    return x;
  }
  function decode(stream: Stream, isKeyString?: boolean): Data {
    const v = stream.getc();
    const type = v >> 5;
    if (type === 0) {
      // positive int
      return decodeUint(stream, v);
    } else if (type === 1) {
      // negative int
      return ~decodeUint(stream, v);
    } else if (type === 2) {
      // byte array
      return stream.chop(decodeUint(stream, v));
    } else if (type === 3) {
      // utf-8 string
      return new TextDecoder("utf-8").decode(
        stream.chop(decodeUint(stream, v))
      );
    } else if (type === 4) {
      // array
      const d = new Array(decodeUint(stream, v))
        .fill(undefined)
        .map((_) => decode(stream));
      return d;
    } else if (type === 5) {
      // object
      // const d: Record<string, Data> = Object.fromEntries(
      //   new Array(decodeUint(stream, v))
      //     .fill(undefined)
      //     .map((_) => [decode(stream), decode(stream)])
      // );
      const dMap: Map<Data, Data> = new Map();
      const dObj: { [key: string]: Data } = {};
      const len = decodeUint(stream, v);
      for (let i = 0; i < len; ++i) {
        const key = decode(stream);
        const value = decode(stream, typeof key === "string");
        dMap.set(key, value);
        dObj[`${key}`] = value;
      }
      return isKeyString ? dObj : dMap;
    }
    return null
    // throw new Error("Invalid data");
  }
  return decode(stream);
}

const encodeBytes = (data: Uint8Array | never[]) => {
  const x = data.length;
  if (x === 0) {
    return [0x40];
  } else if (x <= 23) {
    // small
    return [0x40 + x, ...data];
  } else if (x < 256) {
    // 8-bit
    return [0x40 + 24, x, ...data];
  } else if (x < 65536) {
    // 16-bit
    return [0x40 + 25, x >> 8, x & 0xff, ...data];
  } // leave 32-bit and 64-bit unimplemented
  throw new Error("Too big data");
};

export function encodeToBeSigned(bodyProtected: Uint8Array, payload: Uint8Array) {
  const sig_structure = new Uint8Array([
    // array w/ 4 items
    0x84,
    // #1: context: "Signature1"
    0x6a,
    0x53,
    0x69,
    0x67,
    0x6e,
    0x61,
    0x74,
    0x75,
    0x72,
    0x65,
    0x31,
    // #2: body_protected: CWT headers
    ...encodeBytes(bodyProtected),
    // #3: external_aad: empty
    ...encodeBytes([]),
    // #4: payload: CWT claims
    ...encodeBytes(payload),
  ]);
  const ToBeSigned = sig_structure;
  return ToBeSigned;
}


export const encodeOneCBOR = (obj: any): Buffer => {
  return cbor.encodeOne(obj, { genTypes: [Buffer, cbor.Encoder._pushBuffer] });
};

export const decodeCBOR = (buf: Buffer | Uint8Array): any => {
  const data = decodeCBORStream(new Stream(buf))
  return data
};

export const decodeCBORTagged = (buf: Buffer | Uint8Array): any => {
  const data = cbor.decode(buf);
  return data
};
