import fs from 'fs-extra';
import { readFile } from 'fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url)),
);
const { version } = packageJson;

const sourceDir = 'dist';
const targetDir = `dist/v${version}`;

if (fs.existsSync(targetDir)) {
  fs.removeSync(targetDir);
}

fs.copySync(sourceDir, targetDir, { overwrite: true });
