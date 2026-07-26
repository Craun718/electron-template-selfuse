import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
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
  // better-sqlite3 ships prebuilt `.node` binaries for every target (see
  // `prebuilds/<platform>-<arch>.node`), and its `binding.js` loads those
  // prebuilds *before* ever falling back to a node-gyp-compiled
  // `build/Release/better_sqlite3.node`. The packageAfterCopy hook already
  // copies that whole tree into the staged app. So electron-forge's
  // "Preparing native dependencies" rebuild is pure overhead here — and when
  // cross-packaging (e.g. win32-x64 from macOS) it actually hangs/fails,
  // because @electron/rebuild tries to compile better-sqlite3 from source for
  // the target with no matching native toolchain. Skipping it (empty
  // onlyModules list matches no modules) keeps packaging fast and lets the
  // prebuild load at runtime.
  rebuildConfig: {
    onlyModules: [],
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
    // Portable ZIP works on any host and produces a runnable app for every
    // target. Platform-specific installers need host tooling that is not
    // available when cross-building on macOS:
    //   - MakerSquirrel (Windows .exe): requires Mono + Wine on non-Windows
    //   - MakerDeb / MakerRpm (Linux): need a real Linux dpkg/rpmbuild setup
    // Re-add them with `import { MakerSquirrel } from '@electron-forge/maker-squirrel'`
    // (and the deb/rpm equivalents) plus the matching tools when you need them.
    new MakerZIP({}, ['win32', 'darwin', 'linux']),
    new MakerDMG({}, ['darwin']),
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
