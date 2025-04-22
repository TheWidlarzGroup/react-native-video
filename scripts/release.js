// Run "npm publish" in cli via Bun
import { $ } from 'bun';
import path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);

const noRelease = args.includes("--no-release");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const DRY_RUN = args.includes("--dry-run");

const bumpVersion = (version) => {
  const tagParts = version.split('-');
  const versionParts = tagParts[1].split('.');

  const newVersion = parseInt(versionParts[1]) + 1;

  return `${tagParts[0]}-${versionParts[0]}.${newVersion}`;
}

const writeFile = async (path, content) => {
  if (DRY_RUN) {
    console.log(`DRY RUN: Would write to ${path}`);
    console.log(content);
    console.log('--------------------------------');
  } else {
    await Bun.write(path, content);
  }
}

const runCommand = async (command) => {
  if (DRY_RUN) {
    console.log(`DRY RUN: Would run ${command}`);
    return "";
  } else {
    return await $`${command}`.text();
  }
}

const modifyPackage = async () => {
  const packageJsonPath = path.join(rootDir, 'packages', 'react-native-video', 'package.json');
  const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());

  // We need to modify the name of the package name to be exact as @ORGANIZATION/PACKAGE-NAME
  const name = "@TheWidlarzGroup/react-native-video-v7";
  const version = packageJson.version;

  const newVersion = bumpVersion(version);

  packageJson.name = name;
  packageJson.version = newVersion;

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

let publishCommand = `npm publish --tag dev`;

await modifyPackage();

if (!noRelease) {
  await runCommand(publishCommand);
}

