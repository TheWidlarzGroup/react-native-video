#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const STATIC_DIR = path.join(CWD, 'docs', 'static');

const LLMS_FILE = path.join(STATIC_DIR, 'llms.txt');
const OUTPUT_PATH_STATIC = path.join(STATIC_DIR, 'llms-full.txt');

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      yield full;
    }
  }
}

function gatherDocs() {
  // Crawl all markdown files in the docs directory (excluding the static subdir)
  const docsDir = path.join(CWD, 'docs');
  if (!fs.existsSync(docsDir)) return [];
  return Array.from(walk(docsDir))
    .filter((p) => !p.includes(`${path.sep}static${path.sep}`))
    .sort();
}

function renderFileContent(filepath) {
  const rel = path.relative(CWD, filepath);
  const content = readIfExists(filepath);
  return `\n\n## ${rel}\n\n${content}\n`;
}

function main() {
  const parts = [];
  // 1. quick overview
  parts.push(readIfExists(LLMS_FILE));

  // 2. root README & package README (if present)
  const rootReadme = path.join(CWD, 'README.md');
  if (fs.existsSync(rootReadme)) {
    parts.push('\n\n## README (root)\n\n' + readIfExists(rootReadme));
  }

  // 3. all docs
  for (const file of gatherDocs()) {
    parts.push(renderFileContent(file));
  }

  const output = parts.join('\n');

  fs.mkdirSync(STATIC_DIR, {recursive: true});
  // Write to docs/static so it will be available at <site>/llms-full.txt
  fs.writeFileSync(OUTPUT_PATH_STATIC, output, 'utf8');
  console.log(
    `✔︎ wrote llms-full.txt (size: ${output.length.toLocaleString()} chars)`,
  );
}

main();
