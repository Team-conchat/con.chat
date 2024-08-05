import fs from 'fs-extra';
import { readFile } from 'fs/promises';
import path from 'path';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url)),
);
const { version } = packageJson;

const sourceDir = 'dist';
const tempDir = `temp_v${version}`;
const targetDir = `dist/v${version}`;

if (fs.existsSync(tempDir)) {
  fs.removeSync(tempDir);
}
fs.copySync(sourceDir, tempDir);

if (fs.existsSync(targetDir)) {
  fs.removeSync(targetDir);
}

fs.moveSync(tempDir, targetDir);

const distContents = fs.readdirSync(sourceDir);
distContents.forEach((item) => {
  if (item !== `v${version}`) {
    fs.removeSync(path.join(sourceDir, item));
  }
});
