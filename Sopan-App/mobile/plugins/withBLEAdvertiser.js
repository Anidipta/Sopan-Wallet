const { withMainApplication } = require('@expo/config-plugins');

module.exports = function withBLEAdvertiser(config) {
  return withMainApplication(config, async (config) => {
    const { modResults } = config;
    const { contents } = modResults;

    // Add import for our package
    if (!contents.includes('import com.sopan.BLEAdvertiserPackage')) {
      modResults.contents = contents.replace(
        /import com\.facebook\.react\.ReactPackage;/,
        `import com.facebook.react.ReactPackage;\nimport com.sopan.BLEAdvertiserPackage;`
      );
    }

    // Add package to the list
    if (!contents.includes('new BLEAdvertiserPackage()')) {
      modResults.contents = modResults.contents.replace(
        /packages\.add\(new ModuleRegistryAdapter\(mModuleRegistryProvider\)\);/,
        `packages.add(new ModuleRegistryAdapter(mModuleRegistryProvider));\n      packages.add(new BLEAdvertiserPackage());`
      );
    }

    return config;
  });
};
