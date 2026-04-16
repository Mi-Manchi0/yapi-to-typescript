declare module 'api-spec-converter' {
  export interface ConvertOptions {
    from: string
    to: string
    source: any
  }

  export interface ConvertResult {
    spec: any
    [key: string]: any
  }

  const Converter: {
    convert(options: ConvertOptions): Promise<ConvertResult>
  }

  export default Converter
}
