#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/** Convenience utils */
const CWD = process.cwd();

/** Simple helper that returns the first N lines of README.md (sans markdown headings). */
function getProjectOverview(maxLines = 30) {
  const readmePath = path.join(CWD, 'README.md');
  if (!fs.existsSync(readmePath)) return '';
  const lines = fs.readFileSync(readmePath, 'utf8').split(/\r?\n/);
  return lines.slice(0, maxLines).join('\n');
}

/** Recursively build a filtered tree representation – depth-limited for brevity. */
function buildFileTree(startPath, depth = 0, maxDepth = 2) {
  const ignore = new Set([
    'node_modules',
    '.git',
    'build',
    'android',
    'ios',
    '.docusaurus',
    '.next',
    '.expo',
  ]);

  if (depth > maxDepth) return [];
  const entries = fs.readdirSync(startPath, {withFileTypes: true});
  const lines = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignore.has(entry.name) || entry.name.startsWith('.')) continue;
    const relPath = `${'  '.repeat(depth)}- ${entry.name}${
      entry.isDirectory() ? '/' : ''
    }`;
    lines.push(relPath);
    if (entry.isDirectory()) {
      const childLines = buildFileTree(
        path.join(startPath, entry.name),
        depth + 1,
        maxDepth,
      );
      lines.push(...childLines);
    }
  }
  return lines;
}

/** Minimal usage examples that are helpful for agents. */
function getUsageExamples() {
  return `1. Basic playback\n\n   \`\`\`tsx\n   import Video, { VideoRef } from 'react-native-video';\n   import { useRef } from 'react';\n   \n   export default function Example() {\n     const videoRef = useRef<VideoRef>(null);\n     \n     return (\n       <Video\n         source={{ uri: 'https://example.com/video.mp4' }}\n         ref={videoRef}\n         style={{ width: '100%', aspectRatio: 16 / 9 }}\n         controls\n       />\n     );\n   }\n   \`\`\`\n\n2. Advanced control (seek & pause)\n\n   \`\`\`tsx\n   // Using ref to control playback\n   videoRef.current?.setNativeProps({ paused: true });\n   videoRef.current?.seek(10); // seconds\n   \`\`\``;
}

/** Load docs metadata and build navigation structure */
function generateDocsSections() {
  const docsRoot = path.join(CWD, 'docs', 'pages');
  if (!fs.existsSync(docsRoot)) return [];
  const baseUrl = 'https://docs.thewidlarzgroup.com/react-native-video';

  const sections = [];
  const dirEntries = fs.readdirSync(docsRoot, {withFileTypes: true});
  for (const entry of dirEntries) {
    const absPath = path.join(docsRoot, entry.name);
    if (entry.isDirectory()) {
      const title = toTitle(entry.name);
      const items = collectMarkdownLinks(absPath, `${baseUrl}/${entry.name}`);
      if (items.length) {
        sections.push({title, items});
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // root-level docs
      const title =
        getMarkdownTitle(absPath) || toTitle(entry.name.replace(/\.mdx?$/, ''));
      sections.push({
        title: 'General',
        items: [
          {title, url: `${baseUrl}/${entry.name.replace(/\.mdx?$/, '')}`},
        ],
      });
    }
  }
  return sections;
}

function toTitle(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getMarkdownTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}

function collectMarkdownLinks(dir, urlPrefix) {
  const links = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    if (file.startsWith('_')) continue; // skip _category_.json etc
    const abs = path.join(dir, file);
    const title = getMarkdownTitle(abs) || toTitle(file.replace(/\.mdx?$/, ''));
    links.push({
      title,
      url: `${urlPrefix}/${file.replace(/\.mdx?$/, '')}`,
    });
  }
  return links;
}

function formatDocsSections(sections) {
  if (!sections.length) return '';
  let md = '\n## Documentation\n';
  sections.forEach((sec) => {
    md += `\n### ${sec.title}\n`;
    sec.items.forEach((it) => {
      md += `- [${it.title}](${it.url})\n`;
    });
  });
  return md + '\n';
}

function generateContent() {
  const overview = getProjectOverview();
  const treeLines = buildFileTree(path.join(CWD), 0, 2).join('\n');
  const usage = getUsageExamples();
  const docsSections = formatDocsSections(generateDocsSections());

  return `# react-native-video\n\n> A <Video /> element for React Native - the most battle-tested video player component with support for DRM, offline playback, HLS/DASH streaming, and more.\n\n## Project Overview\n${overview}\n\n## Key Concepts & Terminology\n- **Video**: Main React component for rendering video content\n- **VideoRef**: Imperative API for controlling playback via refs\n- **Source**: Video source configuration (local files, URLs, streams)\n- **DRM**: Built-in support for Widevine & FairPlay DRM\n- **Tracks**: Audio, video, and text track selection and management\n- **Events**: Comprehensive event system for playback state, progress, errors, etc.\n${docsSections}\n## Repository Structure (truncated)\n${treeLines}\n\n## Usage Examples\n${usage}\n\n## Version\nPackage version: ${getPackageVersion()}\n`;
}

function getPackageVersion() {
  const pkgPath = path.join(CWD, 'package.json');
  if (!fs.existsSync(pkgPath)) return 'unknown';
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function writeFileSafe(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), {recursive: true});
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`✔︎ wrote ${path.relative(CWD, targetPath)}`);
}

function main() {
  const content = generateContent();
  writeFileSafe(path.join(CWD, 'docs', 'static', 'llms.txt'), content);
}

main();
