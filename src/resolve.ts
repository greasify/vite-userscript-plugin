import type {
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
  ScriptOptions,
  UserscriptPluginConfig,
} from "./types.js";
import { resolveHomePage } from "./banner.js";
import { pluginName } from "./constants.js";
import { removeDuplicates } from "./grants.js";
import { sanitizeFileName, toIdentifier } from "./names.js";

const ARRAY_HEADER_KEYS = [
  "match",
  "require",
  "include",
  "exclude",
  "resource",
  "connect",
  "antifeature",
  "webRequest",
  "exclude-match",
] as const;

function uniqueHeaderValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return [...new Set(value)];
  }

  return value == null ? [] : [value];
}

function mergeHeader(
  defaults: Partial<HeaderConfig> | undefined,
  header: HeaderConfig,
): HeaderConfig {
  const merged: HeaderConfig = {
    ...(defaults ?? {}),
    ...header,
  };

  for (const key of ARRAY_HEADER_KEYS) {
    const fromDefaults = defaults?.[key];
    const fromHeader = header[key];

    if (fromDefaults != null && fromHeader != null) {
      Object.assign(merged, {
        [key]: uniqueHeaderValues([
          ...uniqueHeaderValues(fromDefaults),
          ...uniqueHeaderValues(fromHeader),
        ]),
      });
    } else if (fromHeader != null) {
      Object.assign(merged, { [key]: uniqueHeaderValues(fromHeader) });
    } else if (fromDefaults != null) {
      Object.assign(merged, { [key]: uniqueHeaderValues(fromDefaults) });
    }
  }

  if (header.grant === "none") {
    merged.grant = "none";
  } else if (defaults?.grant === "none" && header.grant == null) {
    merged.grant = "none";
  } else {
    const grants = removeDuplicates([
      ...removeDuplicates(
        defaults?.grant === "none" ? undefined : defaults?.grant,
      ),
      ...removeDuplicates(header.grant),
    ]);

    if (grants.length) {
      merged.grant = grants;
    } else {
      delete merged.grant;
    }
  }

  return merged;
}

function assertHeader(header: Partial<HeaderConfig>, label: string): void {
  for (const field of ["name", "version", "match"] as const) {
    if (header[field] == null || header[field] === "") {
      throw new Error(
        `[${pluginName}] ${label} is missing required header.${field}`,
      );
    }
  }
}

function toResolvedScript(
  script: ScriptOptions,
  defaults?: Partial<HeaderConfig>,
): ResolvedScript {
  const header = mergeHeader(defaults, script.header);
  assertHeader(header, script.entry);

  const fileName = sanitizeFileName(script.fileName ?? header.name);

  return {
    entry: script.entry,
    fileName,
    iifeName: toIdentifier(fileName),
    header,
  };
}

export function collectAutoMetaUrlsWarnings(config: ResolvedPluginConfig): string[] {
  if (!config.autoMetaUrls) {
    return [];
  }

  const warnings: string[] = [];

  if (!config.metaFile) {
    warnings.push(
      `[${pluginName}] autoMetaUrls is enabled but metaFile is false — @updateURL points at a .meta.js that will not be emitted`,
    );
  }

  for (const script of config.scripts) {
    if (!resolveHomePage(script.header)) {
      warnings.push(
        `[${pluginName}] autoMetaUrls is enabled but "${script.fileName}" has no homepage or homepageURL`,
      );
    }
  }

  return warnings;
}

export function resolvePluginConfig(config: UserscriptPluginConfig): ResolvedPluginConfig {
  const hasScripts = Boolean(config.scripts?.length);
  const hasEntry = Boolean(config.entry);

  if (hasScripts && hasEntry) {
    throw new Error(
      `[${pluginName}] Use either "entry" or "scripts", not both`,
    );
  }

  if (!hasScripts && !hasEntry) {
    throw new Error(
      `[${pluginName}] Provide "entry" or a non-empty "scripts" array`,
    );
  }

  let scripts: ResolvedScript[];

  if (hasScripts) {
    scripts = config.scripts!.map(script => toResolvedScript(script, config.header),
    );
  } else {
    assertHeader(config.header ?? {}, "entry");
    scripts = [
      toResolvedScript({
        entry: config.entry!,
        fileName: config.fileName,
        header: config.header as HeaderConfig,
      }),
    ];
  }

  const names = new Set<string>();
  for (const script of scripts) {
    if (names.has(script.fileName)) {
      throw new Error(
        `[${pluginName}] Duplicate fileName "${script.fileName}"`,
      );
    }
    names.add(script.fileName);
  }

  return {
    scripts,
    server: {
      open: config.server?.open ?? false,
      prefix: config.server?.prefix ?? "server:",
    },
    cssInject: config.cssInject ?? "auto",
    align: config.align ?? 1,
    generate: config.generate,
    autoMetaUrls: config.autoMetaUrls ?? false,
    metaFile: config.metaFile ?? true,
  };
}
