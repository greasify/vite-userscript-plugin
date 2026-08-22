export interface OffsetSourceMap {
  file?: string;
  mappings: string;
  names?: string[];
  sources?: string[];
  sourcesContent?: (string | null)[];
  version: number;
  [key: string]: unknown;
}

export function countBannerLines(prefix: string): number {
  return prefix.endsWith("\n")
    ? prefix.slice(0, -1).split("\n").length
    : prefix.split("\n").length;
}

export function offsetSourceMap<T extends { mappings: string; file?: string }>(map: T, lineOffset: number, fileName?: string): T {
  if (lineOffset <= 0) {
    return fileName ? { ...map, file: fileName } : map;
  }

  return {
    ...map,
    file: fileName ?? map.file,
    mappings: `${";".repeat(lineOffset)}${map.mappings}`,
  };
}
