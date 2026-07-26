import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// @electron/packager extracts the Electron binary via the `extract-zip` lib,
// whose `yauzl` dependency deadlocks when run on Node.js v24 (it streams fine on
// v22). The project pins Node v22 in .nvmrc + package.json `engines`, so refuse
// to run on anything else rather than hanging forever during packaging.
const MAJOR = Number.parseInt(process.version.slice(1), 10);
if (MAJOR !== 22) {
  console.error(
    `\nThis build must run on Node.js v22 (currently ${process.version}).\n` +
      'extract-zip hangs on Node v24. Run `nvm use` (see .nvmrc) and retry.\n',
  );
  process.exit(1);
}

// [platform, arch] targets to build.
// linux/arm defaults to arm64 (aarch64); switch to 'armv7l' for 32-bit ARM.
const targets = [
  ['win32', 'x64'],
  ['darwin', 'arm64'],
  ['linux', 'arm64'],
  ['linux', 'x64'],
];

const failed = [];
for (const [platform, arch] of targets) {
  console.log(`\n=== Building for ${platform}/${arch} ===\n`);
  try {
    execSync(`electron-forge make --platform ${platform} --arch ${arch}`, {
      stdio: 'inherit',
    });
  } catch {
    console.error(`\n!!! Build failed for ${platform}/${arch}\n`);
    failed.push(`${platform}/${arch}`);
  }
}

console.log('\n=== Artifacts in out/make ===');
for (const f of walk('out/make').filter((p) => /\.(zip|dmg|exe|deb|rpm|AppImage)$/i.test(p))) {
  const size = (statSync(f).size / 1024 / 1024).toFixed(1);
  console.log(`  ${f}  (${size} MB)`);
}

if (failed.length > 0) {
  console.error(`\n!!! ${failed.length} target(s) failed: ${failed.join(', ')}\n`);
  process.exit(1);
}

console.log('\n=== All targets built ===\n');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
