
type COSETaggedValue = (Buffer | Record<string, never>)[]

export interface COSETaggedItem {
  tag: number,
  value: COSETaggedValue,
  err?: Error
}
