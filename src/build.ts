import type {
  Grants,
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
} from "./types.js";
import { generateBanner } from "./banner.js";
import { createCssInject } from "./css.js";
import { defineGrants, removeDuplicates } from "./grants.js";
import { countBannerLines, offsetSourceMap } from "./sourcemap.js";

export interface OutputChunk {
  type: "chunk";
  isEntry: boolean;
  name: string;
  fileName: string;
  code: string;
  imports: string[];
  map?: {
    mappings: string;
    file?: string;
  } | null;
  viteMetadata?: {
    importedCss?: Set<string>;
  };
}

export interface OutputAsset {
  type: "asset";
  fileName?: string;
  source: string | Uint8Array;
}

export type OutputBundle = Record<string, OutputChunk | OutputAsset>;

type ChunkWithMeta = OutputChunk;

function isChunk(item: OutputBundle[string]): item is OutputChunk {
  return item.type === "chunk";
}

function isAsset(item: OutputBundle[string]): item is OutputAsset {
  return item.type === "asset";
}

function collectCss(chunk: ChunkWithMeta, bundle: OutputBundle): { css: string; files: string[] } {
  const files = [...(chunk.viteMetadata?.importedCss ?? [])];
  if (!files.length) {
    return { css: "", files };
  }

  const css = files
    .map((file) => {
      const asset = bundle[file];
      return asset && isAsset(asset) ? String(asset.source) : "";
    })
    .filter(Boolean)
    .join("\n");

  return { css, files };
}

export function stripImports(code: string): string {
  return code
    .replace(/(^|\n)import(?:\s+type)?(?:\s+[\s\S]*?\s+|\s+)from\s*["'][^"']+["']\s*;?/g, "$1")
    .replace(/(^|\n)import\s*["'][^"']+["']\s*;?/g, "$1");
}

export function stripExports(code: string): string {
  return code
    .replace(/^export\s+\{[\s\S]*?\}\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^export\s+\{[\s\S]*?\};?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+async\s+function/gm, "async function")
    .replace(/^export\s+function/gm, "function")
    .replace(/^export\s+class/gm, "class")
    .replace(/^export\s+(const|let|var)/gm, "$1");
}

export function stripModuleSyntax(code: string): string {
  return stripExports(stripImports(code));
}

export function ensureIife(code: string): string {
  const alreadyIife = !/^\s*(?:import|export)\s/m.test(code) && /\(function\b/.test(code);
  if (alreadyIife) {
    return code;
  }

  return `(function () {\n${stripModuleSyntax(code)}\n})();\n`;
}

function inlineImportedChunks(
  chunk: OutputChunk,
  bundle: OutputBundle,
  seen = new Set<string>(),
): string {
  let prelude = "";

  for (const imported of chunk.imports) {
    if (seen.has(imported)) {
      continue;
    }

    const dep = bundle[imported];
    if (!dep || !isChunk(dep) || dep.isEntry) {
      continue;
    }

    seen.add(imported);
    prelude += inlineImportedChunks(dep, bundle, seen);
    prelude += dep.code.endsWith("\n") ? dep.code : `${dep.code}\n`;
  }

  return prelude;
}

export function resolveBuildHeader(
  header: HeaderConfig,
  code: string,
  extraGrants: readonly Grants[] = [],
): HeaderConfig {
  if (header.grant === "none") {
    return header;
  }

  return {
    ...header,
    grant: removeDuplicates([
      ...defineGrants(code),
      ...removeDuplicates(header.grant),
      ...extraGrants,
    ]),
  };
}

export function findScriptForChunk(
  chunk: OutputChunk,
  fileName: string,
  scripts: ResolvedScript[],
): ResolvedScript | undefined {
  return scripts.find(
    script => chunk.name === script.fileName
      || fileName === `${script.fileName}.js`
      || fileName === `${script.fileName}.user.js`,
  );
}

function deleteBundleFiles(bundle: OutputBundle, fileNames: Iterable<string>): void {
  for (const fileName of fileNames) {
    delete bundle[fileName];
  }
}

function sweepNonUserscriptAssets(bundle: OutputBundle): void {
  for (const [fileName, item] of Object.entries(bundle)) {
    if (!isAsset(item)) {
      continue;
    }

    if (fileName.endsWith(".css") || (fileName.endsWith(".map") && !fileName.endsWith(".user.js.map"))) {
      delete bundle[fileName];
    }
  }
}

export function applyUserscriptBundle(
  bundle: OutputBundle,
  config: ResolvedPluginConfig,
  emitMeta: (fileName: string, source: string) => void,
): void {
  const leftoverChunks: string[] = [];
  const leftoverAssets: string[] = [];

  for (const [fileName, item] of Object.entries(bundle)) {
    if (!isChunk(item) || !item.isEntry) {
      if (isChunk(item) && !item.isEntry) {
        leftoverChunks.push(fileName);
      }
      continue;
    }

    const script = findScriptForChunk(item, fileName, config.scripts);
    if (!script) {
      continue;
    }

    const inlined = inlineImportedChunks(item, bundle);
    const { css, files: cssFiles } = collectCss(item, bundle);
    leftoverAssets.push(...cssFiles);

    let code = ensureIife(`${inlined}${item.code}`);
    const extraGrants = css && config.cssInject === "auto" ? (["GM_addStyle"] as const) : [];
    const header = resolveBuildHeader(script.header, code, extraGrants);

    if (css) {
      code = `${createCssInject(css, config.cssInject)}${code}`;
    }
    const banner = generateBanner(header, {
      align: config.align,
      autoMetaUrls: config.autoMetaUrls,
      fileName: script.fileName,
      generate: config.generate,
      mode: "build",
    });
    const prefix = `${banner}\n\n`;
    const nextFileName = `${script.fileName}.user.js`;
    const mapFileName = `${nextFileName}.map`;
    let nextCode = `${prefix}${code}`;

    if (item.map) {
      item.map = offsetSourceMap(
        item.map,
        countBannerLines(prefix),
        nextFileName,
      );
      nextCode = nextCode.replace(
        /\/\/[#@]\s*sourceMappingURL=\S+/g,
        `//# sourceMappingURL=${mapFileName}`,
      );
      if (!nextCode.includes("sourceMappingURL=")) {
        nextCode += `\n//# sourceMappingURL=${mapFileName}\n`;
      }
      emitMeta(mapFileName, JSON.stringify(item.map));
      leftoverAssets.push(`${fileName}.map`);
    }

    item.code = nextCode;
    item.fileName = nextFileName;

    if (config.metaFile) {
      emitMeta(
        `${script.fileName}.meta.js`,
        generateBanner(header, {
          align: config.align,
          autoMetaUrls: config.autoMetaUrls,
          fileName: script.fileName,
          generate: config.generate,
          mode: "meta",
        }),
      );
    }
  }

  for (const fileName of leftoverChunks) {
    leftoverAssets.push(`${fileName}.map`);
  }

  deleteBundleFiles(bundle, leftoverChunks);
  deleteBundleFiles(bundle, leftoverAssets);
  sweepNonUserscriptAssets(bundle);
}
