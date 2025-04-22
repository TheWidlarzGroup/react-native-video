import path from 'path';
import { fileURLToPath } from 'url';

// ESM replacement for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Path to the package.json file & react-native-video package.json file
const packageJsonPath = path.join(rootDir, 'package.json');
const reactNativeVideoPackageJsonPath = path.join(
  rootDir,
  'packages',
  'react-native-video',
  'package.json'
);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

async function fetchLicenseFromGitHub(repository) {
  if (!repository) return null;
  let repoUrl = '';
  if (typeof repository === 'string') {
    repoUrl = repository;
  } else if (repository.url) {
    repoUrl = repository.url;
  }
  // Only handle GitHub URLs
  const match = repoUrl.match(/github.com[:/](.+?)(?:\.git)?$/);
  if (!match) return null;
  const repoPath = match[1].replace(/\.git$/, '');
  const branches = ['main', 'master'];
  const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
  for (const branch of branches) {
    for (const file of licenseFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${repoPath}/${branch}/${file}`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 0) {
            return text;
          }
        }
      } catch (e) {
        // Ignore and try next
      }
    }
  }
  return null;
}

async function getLicenseText(pkgPath, processed = new Set(), stats = { found: 0, notFound: 0, skipped: 0, total: 0 }) {
  const packageJson = JSON.parse(await Bun.file(pkgPath).text());
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const licenses = [];

  // Helper to create a unique key for each package
  const getKey = (name, version) => `${name}@${version}`;

  // Iterate through each dependency
  for (const [packageName, versionRange] of Object.entries(dependencies)) {
    try {
      // Path to the package's directory in node_modules
      const packagePath = path.join(rootDir, 'node_modules', packageName);

      // Check if the package is react-native-video
      if (packageName === 'react-native-video') {
        continue;
      }

      // Check if package is at node_modules
      let depPackageJsonPath;
      let depPackageJson;
      try {
        depPackageJsonPath = path.join(packagePath, 'package.json');
        depPackageJson = JSON.parse(await Bun.file(depPackageJsonPath).text());
      } catch {
        console.log(`│  ${colors.gray}└─ Skipping ${packageName}: not found in node_modules (probably dev dependency)${colors.reset}`);
        stats.skipped++;
        continue;
      }

      const depVersion = depPackageJson.version;
      const key = getKey(packageName, depVersion);
      if (processed.has(key)) {
        continue;
      }
      processed.add(key);
      stats.total++;

      console.log(`${colors.cyan}├─ Getting license for ${packageName}@${depVersion}${colors.reset}`);

      // Extract license info from the dependency's package.json
      const license =
        depPackageJson.license || 'License information not available';

      // Look for a LICENSE file in the dependency's directory
      let licenseText = 'License text not available';
      const licenseFilePath = ['LICENSE', 'LICENSE.txt', 'LICENSE.md']
        .map((file) => path.join(packagePath, file));
      let foundLocal = false;
      for (const filePath of licenseFilePath) {
        if (await Bun.file(filePath).exists()) {
          console.log(`│  ${colors.green}└─ Found license in local files (${path.basename(filePath)})${colors.reset}`);
          licenseText = await Bun.file(filePath).text();
          foundLocal = true;
          stats.found++;
          break;
        }
      }
      // If not found locally, try to fetch from GitHub
      if (!foundLocal && depPackageJson.repository) {
        console.log(`│  ${colors.yellow}├─ Fetching license from GitHub...${colors.reset}`);
        const githubLicense = await fetchLicenseFromGitHub(depPackageJson.repository);
        if (githubLicense) {
          console.log(`│  ${colors.green}└─ Found license on GitHub.${colors.reset}`);
          licenseText = githubLicense;
          stats.found++;
        } else {
          console.log(`│  ${colors.red}└─ Could not find license on GitHub.${colors.reset}`);
          stats.notFound++;
        }
      } else if (!foundLocal) {
        console.log(`│  ${colors.red}└─ Could not find license locally or on GitHub.${colors.reset}`);
        stats.notFound++;
      }

      // Add the formatted license information
      licenses.push(`
### ${packageName} (${depVersion})
- **License**: ${license}
- **Version**: ${depVersion}

${licenseText}
      `);

      // Recursively process this dependency's dependencies
      const subLicenses = await getLicenseText(depPackageJsonPath, processed, stats);
      licenses.push(...subLicenses);
    } catch (error) {
      console.error(
        `${colors.red}Failed to retrieve license for ${packageName}: ${error.message}${colors.reset}`
      );
    }
  }
  return licenses;
}

async function generateLicensesFile() {
  const processed = new Set();
  const stats = { found: 0, notFound: 0, skipped: 0, total: 0 };
  const licenses = [
    ...(await getLicenseText(packageJsonPath, processed, stats)),
    ...(await getLicenseText(reactNativeVideoPackageJsonPath, processed, stats)),
  ];

  // Write to THIRD-PARTY-LICENSES file at ./packages/react-native-video
  await Bun.write(
    path.join(
      rootDir,
      'packages',
      'react-native-video',
      'THIRD-PARTY-LICENSES'
    ),
    licenses.join('\n---\n')
  );
  console.log(
    `THIRD-PARTY-LICENSES file generated at ${path.join(
      rootDir,
      'packages',
      'react-native-video',
      'THIRD-PARTY-LICENSES'
    )}`
  );

  // Copy LICENSE file to ./packages/react-native-video
  await Bun.write(
    path.join(
      rootDir,
      'packages',
      'react-native-video',
      'LICENSE'
    ),
    await Bun.file(path.join(rootDir, 'LICENSE')).text()
  );

  // Print stats
  console.log('\n' + colors.cyan + 'License Collection Stats:' + colors.reset);
  console.log(`${colors.green}  Found:   ${stats.found}${colors.reset}`);
  console.log(`${colors.red}  Not found: ${stats.notFound}${colors.reset}`);
  console.log(`${colors.gray}  Skipped: ${stats.skipped}${colors.reset}`);
  console.log(`${colors.cyan}  Total unique packages: ${stats.total}${colors.reset}`);
}

generateLicensesFile();
