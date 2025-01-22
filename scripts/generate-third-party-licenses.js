const fs = require('fs');
const path = require('path');

// Path to the package.json file & react-native-video package.json file
const packageJsonPath = path.join(__dirname, 'package.json');
const reactNativeVideoPackageJsonPath = path.join(
  __dirname,
  'packages',
  'react-native-video',
  'package.json'
);

function getLicenseText(path) {
  const packageJson = JSON.parse(fs.readFileSync(path, 'utf-8'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const licenses = [];

  // Iterate through each dependency
  for (const [packageName, version] of Object.entries(dependencies)) {
    try {
      // Path to the package's directory in node_modules
      const packagePath = path.join(__dirname, 'node_modules', packageName);

      // Check if the package is react-native-video
      if (packageName === 'react-native-video') {
        continue;
      }

      // Check if package is at node_modules
      if (!fs.existsSync(packagePath)) {
        continue;
      }

      // Load package.json of the dependency
      const depPackageJsonPath = path.join(packagePath, 'package.json');
      const depPackageJson = JSON.parse(
        fs.readFileSync(depPackageJsonPath, 'utf-8')
      );

      // Extract license info and version from the dependency's package.json
      const license =
        depPackageJson.license || 'License information not available';
      const depVersion = depPackageJson.version;

      // Look for a LICENSE file in the dependency's directory
      let licenseText = 'License text not available';
      const licenseFilePath = ['LICENSE', 'LICENSE.txt', 'LICENSE.md']
        .map((file) => path.join(packagePath, file))
        .find(fs.existsSync);

      if (licenseFilePath) {
        licenseText = fs.readFileSync(licenseFilePath, 'utf-8');
      }

      // Add the formatted license information
      licenses.push(`
### ${packageName} (${depVersion})
- **License**: ${license}
- **Version**: ${version}

${licenseText}
      `);
    } catch (error) {
      console.error(
        `Failed to retrieve license for ${packageName}: ${error.message}`
      );
    }
  }
}

async function generateLicensesFile() {
  const licenses = [
    getLicenseText(packageJsonPath),
    getLicenseText(reactNativeVideoPackageJsonPath),
  ];

  // Write to THIRD-PARTY-LICENSES file at ./packages/react-native-video
  fs.writeFileSync(
    path.join(__dirname, 'packages', 'react-native-video', 'THIRD-PARTY-LICENSES'),
    licenses.join('\n---\n'),
    'utf-8'
  );  
  console.log(
    `THIRD-PARTY-LICENSES file generated at ${path.join(__dirname, 'packages', 'react-native-video', 'THIRD-PARTY-LICENSES')}`
  );

  // Copy LICENSE file to ./packages/react-native-video
  fs.copyFileSync(
    path.join(__dirname, 'LICENSE'),
    path.join(__dirname, 'packages', 'react-native-video', 'LICENSE')
  );
}

generateLicensesFile();
