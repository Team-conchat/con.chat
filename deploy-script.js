import fs from 'fs-extra';
import { readFile } from 'fs/promises';
import path from 'path';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url)),
);
const { version } = packageJson;

const distDir = 'dist';
const versionDir = `v${version}`;

if (fs.existsSync(path.join(distDir, versionDir, 'assets'))) {
  console.log(
    `Correct structure already exists: ${path.join(distDir, versionDir)}`,
  );
} else {
  const tempDir = `temp_${versionDir}`;

  fs.copySync(distDir, tempDir);

  fs.emptyDirSync(distDir);

  fs.moveSync(tempDir, path.join(distDir, versionDir));

  console.log(`Restructured to: ${path.join(distDir, versionDir)}`);
}
