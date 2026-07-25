import { execSync } from 'node:child_process';

// [platform, arch] targets to build.
// linux/arm defaults to arm64 (aarch64); switch to 'armv7l' for 32-bit ARM.
const targets = [
  ['win32', 'x64'],
  ['darwin', 'arm64'],
  ['linux', 'arm64'],
  ['linux', 'x64'],
];

for (const [platform, arch] of targets) {
  console.log(`\n=== Building for ${platform}/${arch} ===\n`);
  try {
    execSync(`electron-forge make --platform ${platform} --arch ${arch}`, {
      stdio: 'inherit',
    });
  } catch {
    console.error(`\n!!! Build failed for ${platform}/${arch}\n`);
    process.exit(1);
  }
}

console.log('\n=== All targets built ===\n');
