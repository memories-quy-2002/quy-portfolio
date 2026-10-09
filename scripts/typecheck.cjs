'use strict';

const fs = require('node:fs');
const path = require('node:path');

const sourceDirectory = path.resolve(__dirname, '..', 'src');
const typeScriptFiles = [];

function collectTypeScript(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectTypeScript(entryPath);
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      typeScriptFiles.push(entryPath);
    }
  }
}

collectTypeScript(sourceDirectory);

if (typeScriptFiles.length === 0) {
  console.log('Typecheck skipped: this project has no TypeScript source files.');
} else {
  console.error('TypeScript files were found, but no TypeScript compiler is configured.');
  console.error('Add TypeScript and a tsconfig.json before relying on this check.');
  process.exitCode = 1;
}
