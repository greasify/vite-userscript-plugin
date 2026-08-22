import type { Logger } from "vite";
import type { BannerOptions } from "./banner.js";
import type {
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
} from "./types.js";

import { posix, relative, resolve, sep } from "node:path";
import { styleText } from "node:util";
import { generateBanner } from "./banner.js";
import {
  GM_NAMESPACE,
  gmIdentifiers,
  grants,
  REACT_BOOTSTRAP_PATH,
  REACT_PREAMBLE_PATH,
  REACT_REFRESH_PLUGIN_NAMES,
  VITE_CLIENT_FLAG,
} from "./constants.js";

export const DEV_SCRIPT_HEADERS = {
  "Content-Type": "text/javascript; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

export function matchDevUserscript(url: string, fileName: string): boolean {
  const path = url.split("?")[0] ?? "";
  return path === `/${fileName}.dev.user.js`;
}

export function toInstallUrl(origin: string, fileName: string): string {
  return `${origin.replace(/\/$/, "")}/${fileName}.dev.user.js`;
}

export function formatInstallLine(installUrl: string): string {
  const coloredUrl = styleText(
    "cyan",
    installUrl.replace(
      /:(\d+)\//,
      (_match, port: string) => `:${styleText("bold", port)}/`,
    ),
  );

  return `  ${styleText("green", "➜")}  ${styleText("bold", "Userscript")}: ${coloredUrl}`;
}

export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex -- ESC prefix of ANSI CSI sequences
  return text.replace(/\u001B\[[0-9;]*m/g, "");
}

export function isViteLocalUrlLine(message: string): boolean {
  return /Local:\s/.test(stripAnsi(message));
}

export function createAfterLocalLogger(info: Logger["info"], localCount: number, onAfterLocal: () => void): { info: Logger["info"]; flush: () => void } {
  let remaining = localCount;
  let printed = false;

  const flush = (): void => {
    if (printed) {
      return;
    }

    printed = true;
    onAfterLocal();
  };

  return {
    info: (msg, options) => {
      info(msg, options);

      if (remaining > 0 && isViteLocalUrlLine(String(msg))) {
        remaining -= 1;
        if (remaining === 0) {
          flush();
        }
      }
    },
    flush,
  };
}

export function toServeEntryPath(root: string, entry: string): string {
  const absolute = resolve(root, entry);
  const rel = relative(root, absolute).split(sep).join(posix.sep);
  return `/${rel}`;
}

export function applyServeHeader(header: HeaderConfig, prefix: string | false): HeaderConfig {
  if (header.grant === "none") {
    return {
      ...header,
      name: prefix === false ? header.name : `${prefix}${header.name}`,
    };
  }

  return {
    ...header,
    name: prefix === false ? header.name : `${prefix}${header.name}`,
    grant: [...new Set([...(header.grant ?? []), ...grants])],
  };
}

export function hasReactRefreshPlugin(plugins: readonly { name: string }[]): boolean {
  return plugins.some(plugin => REACT_REFRESH_PLUGIN_NAMES.has(plugin.name));
}

export function matchReactPreamble(url: string): boolean {
  const path = url.split("?")[0] ?? "";
  return path === REACT_PREAMBLE_PATH;
}

export function matchReactBootstrap(url: string): boolean {
  const path = url.split("?")[0] ?? "";
  return path === REACT_BOOTSTRAP_PATH;
}

export function resolveBootstrapEntry(url: string): string | undefined {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  const entry = new URLSearchParams(query).get("entry");
  if (!entry?.startsWith("/") || entry.startsWith("//")) {
    return undefined;
  }

  return entry;
}

export function createReactPreambleModule(): string {
  return `import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
`;
}

export function createReactBootstrapModule(entryPath: string): string {
  return `import "/@vite/client";
import ${JSON.stringify(REACT_PREAMBLE_PATH)};
import ${JSON.stringify(entryPath)};
`;
}

export function generateDevWrapper(options: {
  origin: string;
  entryPath: string;
  reactPreamble?: boolean;
}): string {
  const clientUrl = `${options.origin}/@vite/client`;
  const entryUrl = `${options.origin}${options.entryPath}`;
  const bootstrapUrl = `${options.origin}${REACT_BOOTSTRAP_PATH}?entry=${encodeURIComponent(options.entryPath)}`;
  const copies = gmIdentifiers
    .map(
      id => `if (typeof ${id} !== 'undefined') gm.${id} = ${id};`,
    )
    .join("\n  ");
  const injectTarget = options.reactPreamble ? bootstrapUrl : entryUrl;
  const clientInject = options.reactPreamble
    ? ""
    : `
  if (!root.${VITE_CLIENT_FLAG}) {
    root.${VITE_CLIENT_FLAG} = true;
    inject(${JSON.stringify(clientUrl)});
  }`;

  return `(function () {
  var root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  var gm = root.${GM_NAMESPACE} || {};
  ${copies}
  root.${GM_NAMESPACE} = gm;

  function inject(src) {
    var script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    (document.head || document.documentElement).appendChild(script);
  }
${clientInject}
  inject(${JSON.stringify(injectTarget)});
})();
`;
}

export function generateDevUserscript(options: {
  script: ResolvedScript;
  origin: string;
  root: string;
  prefix: string | false;
  banner: BannerOptions;
  reactPreamble?: boolean;
}): string {
  const header = applyServeHeader(options.script.header, options.prefix);
  const banner = generateBanner(header, {
    ...options.banner,
    fileName: options.script.fileName,
    mode: "serve",
  });
  const wrapper = generateDevWrapper({
    origin: options.origin,
    entryPath: toServeEntryPath(options.root, options.script.entry),
    reactPreamble: options.reactPreamble,
  });

  return `${banner}\n\n${wrapper}`;
}

export function findDevScript(url: string, scripts: ResolvedScript[]): ResolvedScript | undefined {
  return scripts.find(script => matchDevUserscript(url, script.fileName));
}

export function createDevUserscript(config: ResolvedPluginConfig, options: {
  origin: string;
  root: string;
  script: ResolvedScript;
  reactPreamble?: boolean;
}): string {
  return generateDevUserscript({
    script: options.script,
    origin: options.origin,
    root: options.root,
    prefix: config.server.prefix,
    banner: {
      align: config.align,
      autoMetaUrls: config.autoMetaUrls,
      generate: config.generate,
    },
    reactPreamble: options.reactPreamble,
  });
}
