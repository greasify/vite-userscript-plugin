import type {
  BannerGenerateContext,
  BannerMode,
  HeaderConfig,
} from "./types.js";
import { sanitizeFileName } from "./names.js";

export interface BannerOptions {
  align?: number | false;
  autoMetaUrls?: boolean;
  fileName?: string;
  generate?: (ctx: BannerGenerateContext) => string;
  mode?: BannerMode;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function resolveHomePage(header: HeaderConfig): string | undefined {
  const homePage = header.homepage ?? header.homepageURL;
  if (typeof homePage !== "string") {
    return undefined;
  }

  const trimmed = homePage.trim();
  return trimmed === "" ? undefined : trimmed;
}

function applyAutoMetaUrls(header: HeaderConfig, fileName: string): HeaderConfig {
  const homePage = resolveHomePage(header);
  if (!homePage) {
    return header;
  }

  const base = ensureTrailingSlash(homePage);
  return {
    ...header,
    updateURL: header.updateURL ?? new URL(`${fileName}.meta.js`, base).href,
    downloadURL: header.downloadURL ?? new URL(`${fileName}.user.js`, base).href,
  };
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (value === true) {
    return "";
  }

  return String(value);
}

export function generateBanner(config: HeaderConfig, options: BannerOptions = {}): string {
  const fileName = options.fileName ?? sanitizeFileName(config.name);
  const header = options.autoMetaUrls
    ? applyAutoMetaUrls({ ...config }, fileName)
    : { ...config };

  const keys = Object.keys(header).filter((key) => {
    const value = header[key];
    return value !== undefined && value !== null && value !== false;
  });

  const align = options.align;
  const maxKeyLength
    = align === false
      ? 0
      : Math.max(...keys.map(key => key.length), 0) + (align ?? 1);

  const pad = (key: string): string => {
    if (align === false) {
      return " ";
    }

    return " ".repeat(Math.max(1, maxKeyLength - key.length));
  };

  const lines: string[] = [];

  const addMetadata = (key: string, value: unknown): void => {
    lines.push(`// @${key}${pad(key)}${formatValue(value)}`);
  };

  for (const key of keys) {
    const value = header[key];
    if (Array.isArray(value)) {
      value.forEach(item => addMetadata(key, item));
    } else {
      addMetadata(key, value);
    }
  }

  const userscript = [
    "// ==UserScript==",
    ...lines,
    "// ==/UserScript==",
  ].join("\n");

  if (!options.generate) {
    return userscript;
  }

  return options.generate({
    userscript,
    mode: options.mode ?? "build",
  });
}

export class Banner {
  constructor(
    private readonly config: HeaderConfig,
    private readonly options: BannerOptions = {},
  ) {}

  generate() {
    return generateBanner(this.config, this.options);
  }
}
