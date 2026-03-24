const { strings } = require('@angular-devkit/core');
const { SchematicsException } = require('@angular-devkit/schematics');

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "\\'");
}

function findObjectCloseIndex(content, openBraceIndex) {
  let depth = 0;
  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function insertInObject(content, openBraceIndex, entry, indent) {
  const closeIndex = findObjectCloseIndex(content, openBraceIndex);
  if (closeIndex === -1) {
    throw new SchematicsException('Could not resolve target object in toolbar config file.');
  }

  const beforeClose = content.slice(0, closeIndex);
  const lastSignificantCharMatch = beforeClose.match(/(\S)\s*$/);
  const lastSignificantChar = lastSignificantCharMatch ? lastSignificantCharMatch[1] : '';

  const needsComma = lastSignificantChar && lastSignificantChar !== '{' && lastSignificantChar !== ',';
  const insertion = `${needsComma ? ',' : ''}\n${indent}${entry}\n`;

  return content.slice(0, closeIndex) + insertion + content.slice(closeIndex);
}

function ensureDomainInToolbarTabsConfig(source, domainName) {
  const alreadyExists =
    source.includes(`'${domainName}':`) || source.includes(` ${domainName}:`);
  if (alreadyExists) {
    return source;
  }

  const toolbarConstIndex = source.indexOf('toolbarTabsConfig');
  if (toolbarConstIndex === -1) {
    throw new SchematicsException('Could not find toolbarTabsConfig in toolbar tabs config.');
  }

  const objectOpenIndex = source.indexOf('{', toolbarConstIndex);
  if (objectOpenIndex === -1) {
    throw new SchematicsException('Could not find toolbar tabs config object start.');
  }

  return insertInObject(source, objectOpenIndex, `'${domainName}': []`, '  ');
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

    const toolbarTabsConfigPath = 'src/app/shell/navigation/toolbar-tabs.config.ts';
    if (!tree.exists(toolbarTabsConfigPath)) {
      throw new SchematicsException(`File not found: ${toolbarTabsConfigPath}`);
    }

    const toolbarTabsSourceBuffer = tree.read(toolbarTabsConfigPath);
    if (!toolbarTabsSourceBuffer) {
      throw new SchematicsException(`Could not read: ${toolbarTabsConfigPath}`);
    }

    const toolbarTabsSource = toolbarTabsSourceBuffer.toString('utf-8');
    const updatedToolbarTabsSource = ensureDomainInToolbarTabsConfig(
      toolbarTabsSource,
      domainName,
    );
    if (updatedToolbarTabsSource !== toolbarTabsSource) {
      tree.overwrite(toolbarTabsConfigPath, updatedToolbarTabsSource);
    }

    return tree;
  };
}

module.exports = createDomainSchematic;
module.exports.default = createDomainSchematic;
