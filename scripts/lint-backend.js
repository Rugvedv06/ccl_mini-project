#!/usr/bin/env node
/**
 * Lightweight backend linter: syntax-checks every backend source file with
 * `node --check` and fails on common accidental secrets in code.
 * Keeps the backend dependency-free while still catching broken files.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');

const files = fs
  .globSync('**/*.js', { cwd: backendDir })
  .filter((f) => !f.includes('node_modules'))
  .map((f) => path.join(backendDir, f));

const forbidden = [
  { re: /AKIA[0-9A-Z]{16}/, msg: 'looks like an AWS access key id' },
  { re: /aws_secret_access_key\s*=/i, msg: 'hard-coded AWS secret access key' },
  { re: /BEGIN (RSA |EC )?PRIVATE KEY/, msg: 'private key material' },
];

let failed = false;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failed = true;
    console.error(`Syntax error in ${path.relative(root, file)}:\n${err.stderr}`);
  }
  const src = fs.readFileSync(file, 'utf8');
  for (const { re, msg } of forbidden) {
    if (re.test(src)) {
      failed = true;
      console.error(`Secret scan: ${path.relative(root, file)} ${msg}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log(`backend lint: ${files.length} files OK`);
