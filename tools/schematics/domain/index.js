const { strings } = require('@angular-devkit/core');
const { SchematicsException } = require('@angular-devkit/schematics');

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "\\'");
}

function createDomainSchematic(options) {
  return (tree) => {
    if (!options?.name) {
      throw new SchematicsException('The "name" option is required.');
    }

    const domainName = strings.dasherize(options.name);
    const defaultLabel = strings.classify(options.name);
    const label = options.label?.trim() || defaultLabel;
    const icon = options.icon?.trim() || 'folder';
    const hasSub = options.hasSub === true;

    const domainRoot = `src/app/domains/${domainName}`;
    ['data-access', 'features', 'ui'].forEach((folder) => {
      const gitkeepPath = `${domainRoot}/${folder}/.gitkeep`;
      if (!tree.exists(gitkeepPath)) {
        tree.create(gitkeepPath, '');
      }
    });

    const routeConstName = `${strings.camelize(domainName)}Routes`;
    const routesFilePath = `${domainRoot}/${domainName}.routes.ts`;
    if (!tree.exists(routesFilePath)) {
      tree.create(
        routesFilePath,
        `import { Routes } from '@angular/router';\n\nexport const ${routeConstName}: Routes = [];\n`,
      );
    }

    const navigationConfigPath = 'src/app/shell/navigation/navigation.config.ts';
    if (!tree.exists(navigationConfigPath)) {
      throw new SchematicsException(`File not found: ${navigationConfigPath}`);
    }

    const navigationSourceBuffer = tree.read(navigationConfigPath);
    if (!navigationSourceBuffer) {
      throw new SchematicsException(`Could not read: ${navigationConfigPath}`);
    }

    const navigationSource = navigationSourceBuffer.toString('utf-8');
    if (!navigationSource.includes(`module: '${domainName}'`)) {
      const navItem = `  { label: '${escapeSingleQuotes(label)}', icon: '${escapeSingleQuotes(icon)}', module: '${domainName}',${hasSub ? ' hasSub: true,' : ''} route: '/${domainName}' },\n`;

      const arrayEndIndex = navigationSource.lastIndexOf('];');
      if (arrayEndIndex === -1) {
        throw new SchematicsException(
          `Could not find navigation array end in ${navigationConfigPath}`,
        );
      }

      const updatedNavigationSource =
        navigationSource.slice(0, arrayEndIndex) +
        navItem +
        navigationSource.slice(arrayEndIndex);

      tree.overwrite(navigationConfigPath, updatedNavigationSource);
    }

    return tree;
  };
}

module.exports = createDomainSchematic;
module.exports.default = createDomainSchematic;
