'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceRoots = [path.join(root, 'src'), path.join(root, 'scripts')];
const files = [path.join(root, 'vite.config.js')];

function collectJavaScript(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJavaScript(entryPath);
    else if (/\.(?:c?js|mjs)$/.test(entry.name)) files.push(entryPath);
  }
}

for (const directory of sourceRoots) collectJavaScript(directory);

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout);
  }
}

if (failed) process.exitCode = 1;
else console.log(`Syntax lint passed for ${files.length} JavaScript files.`);
