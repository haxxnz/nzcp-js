import { Data } from "./cborTypes";

type DecodedCOSEValue = Data[];

interface DecodedCOSEStructureSuccess {
    tag: number
    value: DecodedCOSEValue
    err: Error
}

interface DecodedCOSEStructureError {
    tag: number
    value: DecodedCOSEValue
    err: undefined
}

export type DecodedCOSEStructure = DecodedCOSEStructureSuccess | DecodedCOSEStructureError
