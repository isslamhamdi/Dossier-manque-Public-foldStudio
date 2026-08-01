declare module 'ndef' {
  function uriRecord(uri: string): unknown
  function textRecord(text: string, lang?: string): unknown
  function encodeMessage(records: unknown[]): number[]
  const ndef: { uriRecord: typeof uriRecord; textRecord: typeof textRecord; encodeMessage: typeof encodeMessage }
  export { uriRecord, textRecord, encodeMessage }
  export default ndef
}
