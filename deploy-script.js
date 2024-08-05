const fs = require('fs-extra');
const { version } = require('./package.json');

const sourceDir = 'dist';
const targetDir = `dist/v${version}`;

if (fs.existsSync(targetDir)) {
  fs.removeSync(targetDir);
}

fs.copySync(sourceDir, targetDir, { overwrite: true });
