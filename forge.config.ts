import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import type { FuseConfig } from '@electron/fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Packages Vite cannot inline (see vite.main.config.ts `external`). We must
// ship these — and their full transitive runtime dependency tree — inside the
// packaged app's node_modules so the runtime requires resolve. The closure is
// computed automatically so it stays correct when versions are bumped.
const moduleRequire = createRequire(import.meta.url);
function dependencyClosure(roots: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const name = queue.pop()!;
    if (seen.has(name)) continue;
    seen.add(name);
    let pkg: { dependencies?: Record<string, string> };
    try {
      pkg = moduleRequire(moduleRequire.resolve(`${name}/package.json`));
    } catch {
      continue;
    }
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return seen;
}

// Roots that are externalized in the Vite main build.
const externalPackages = dependencyClosure(['better-sqlite3', 'ajv', 'ajv-formats']);
const projectRoot = dirname(fileURLToPath(import.meta.url));

const fuses: FuseConfig = {
  version: FuseVersion.V1,
  resetAdHocDarwinSignature: true,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
};

const config: ForgeConfig = {
  packagerConfig: {
    executableName: 'electron-template',
    // Vite bundles main/preload/renderer; only native modules and ajv (whose
    // `exports` field blocks the subpaths rollup needs) stay external. Those
    // plus their transitive deps are copied in by the packageAfterCopy hook,
    // keeping the package lean. Unpack native .node from the asar to load it.
    asar: {
      unpack: '**/*.node',
    },
  },
  hooks: {
    // After electron-packager copies the staged `.vite/` output (and before it
    // builds the asar), inject only the externalized native + ajv closure so
    // their runtime requires resolve. Everything else is already inlined by
    // Vite, so this stays minimal.
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      for (const pkg of externalPackages) {
        await cp(
          join(projectRoot, 'node_modules', pkg),
          join(buildPath, 'node_modules', pkg),
          { recursive: true },
        );
      }
    },
  },
  makers: [
    new MakerSquirrel({}, ['win32']),
    new MakerDMG({}, ['darwin']),
    new MakerZIP({}, ['darwin', 'linux']),
    new MakerDeb({ options: {} }, ['linux']),
    new MakerRpm({ options: {} }, ['linux']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
    new FusesPlugin(fuses),
  ],
};

export default config;
