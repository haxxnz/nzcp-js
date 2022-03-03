import { Data } from "./cborTypes";

type DecodedCOSEValue = Data[];

export type DecodedCOSEStructureSuccess = { tag: number, value: DecodedCOSEValue, err: Error }

export type DecodedCOSEStructureError = { tag: number; value: DecodedCOSEValue; err: undefined }

export type DecodedCOSEStructure = DecodedCOSEStructureSuccess | DecodedCOSEStructureError
