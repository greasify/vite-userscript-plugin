import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SOURCES = [
  { name: "tampermonkey", pkg: "@types/tampermonkey" },
  { name: "greasemonkey", pkg: "@types/greasemonkey" },
  { name: "violentmonkey", pkg: "@violentmonkey/types" },
] as const;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const typesDir = join(root, "types");
const ambientPath = join(typesDir, "violentmonkey-ambient.d.ts");

function syncHeader(pkg: string, version: string): string {
  return `// synced from ${pkg}@${version}\n// do not edit; run pnpm sync-types\n\n`;
}

async function packPackage(pkg: string, dest: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", pkg, "--pack-destination", dest, "--json"],
    { cwd: dest },
  );
  const [result] = JSON.parse(stdout) as { filename?: string }[];
  const filename = result?.filename;

  if (!filename) {
    throw new Error(`npm pack produced no tarball for ${pkg}`);
  }

  return join(dest, filename);
}

async function extractIndexDts(tgz: string, dest: string): Promise<{ dts: string; version: string }> {
  await execFileAsync("tar", ["-xzf", tgz, "-C", dest]);

  const entries = await readdir(dest, { withFileTypes: true });
  const pkgDir = entries.find(entry => entry.isDirectory());

  if (!pkgDir) {
    throw new Error(`tarball ${tgz} has no package directory`);
  }

  const extracted = join(dest, pkgDir.name);
  const dts = await readFile(join(extracted, "index.d.ts"), "utf8");
  const pkgJson = JSON.parse(
    await readFile(join(extracted, "package.json"), "utf8"),
  ) as { version?: string };

  if (!pkgJson.version) {
    throw new Error(`package.json in ${tgz} has no version`);
  }

  return { dts, version: pkgJson.version };
}

function rewriteViolentmonkey(source: string): string {
  const withoutRefs = source.replace(
    /^\/\/\/\s*<reference\s+types="[^"]+"\s*\/>\s*/gm,
    "",
  );
  const ref = "/// <reference path=\"./violentmonkey-ambient.d.ts\" />\n";

  return withoutRefs.startsWith(ref) ? withoutRefs : `${ref}${withoutRefs}`;
}

async function main(): Promise<void> {
  await mkdir(typesDir, { recursive: true });
  await access(ambientPath);

  const sources: Record<string, { package: string; version: string }> = {};

  for (const source of SOURCES) {
    const tmp = await mkdtemp(join(tmpdir(), `vup-sync-${source.name}-`));

    try {
      const tgz = await packPackage(source.pkg, tmp);
      const { dts, version } = await extractIndexDts(tgz, tmp);
      const body
        = source.name === "violentmonkey" ? rewriteViolentmonkey(dts) : dts;

      await writeFile(
        join(typesDir, `${source.name}.d.ts`),
        `${syncHeader(source.pkg, version)}${body}`,
      );
      sources[source.name] = { package: source.pkg, version };
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }

  await writeFile(
    join(typesDir, "sources.json"),
    `${JSON.stringify(sources, null, 2)}\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
