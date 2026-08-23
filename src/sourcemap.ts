import { Buffer } from "node:buffer";

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

export function offsetSourceMap<T extends { mappings: string; file?: string }>(
  map: T,
  lineOffset: number,
  fileName?: string,
): T {
  if (lineOffset <= 0) {
    return fileName ? { ...map, file: fileName } : map;
  }

  return {
    ...map,
    file: fileName ?? map.file,
    mappings: `${";".repeat(lineOffset)}${map.mappings}`,
  };
}

export function toInlineSourceMappingUrl(map: unknown): string {
  const encoded = Buffer.from(JSON.stringify(map)).toString("base64");
  return `data:application/json;charset=utf-8;base64,${encoded}`;
}
