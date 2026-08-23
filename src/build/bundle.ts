export interface OutputChunk {
  type: 'chunk'
  isEntry: boolean
  name: string
  fileName: string
  code: string
  imports: string[]
  map?: {
    mappings: string
    file?: string
  } | null
  viteMetadata?: {
    importedCss?: Set<string>
  }
}

export interface OutputAsset {
  type: 'asset'
  fileName?: string
  source: string | Uint8Array
}

export type OutputBundle = Record<string, OutputChunk | OutputAsset>

export function isChunk(item: OutputBundle[string]): item is OutputChunk {
  return item.type === 'chunk'
}

export function isAsset(item: OutputBundle[string]): item is OutputAsset {
  return item.type === 'asset'
}
