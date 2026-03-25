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

function findArrayCloseIndex(content, openBracketIndex) {
  let depth = 0;
  for (let index = openBracketIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function insertInArray(content, openBracketIndex, entry, indent) {
  const closeIndex = findArrayCloseIndex(content, openBracketIndex);
  if (closeIndex === -1) {
    throw new SchematicsException('Could not resolve target array in routes file.');
  }

  const beforeClose = content.slice(0, closeIndex);
  const lastSignificantCharMatch = beforeClose.match(/(\S)\s*$/);
  const lastSignificantChar = lastSignificantCharMatch ? lastSignificantCharMatch[1] : '';

  const needsComma = lastSignificantChar && lastSignificantChar !== '[' && lastSignificantChar !== ',';
  const insertion = `${needsComma ? ',' : ''}\n${indent}${entry}\n`;

  return content.slice(0, closeIndex) + insertion + content.slice(closeIndex);
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

function ensureDomainInAppRoutes(source, domainName, routeConstName) {
  const importNeedle = `./domains/${domainName}/${domainName}.routes`;
  if (source.includes(importNeedle)) {
    return source;
  }

  const childrenIndex = source.indexOf('children');
  if (childrenIndex === -1) {
    throw new SchematicsException('Could not find children array in app.routes.ts');
  }

  const childrenOpenBracketIndex = source.indexOf('[', childrenIndex);
  if (childrenOpenBracketIndex === -1) {
    throw new SchematicsException('Could not find children array start in app.routes.ts');
  }

  const entry = `{
        path: '${domainName}',
        loadChildren: () => import('./domains/${domainName}/${domainName}.routes').then((m) => m.${routeConstName}),
      }`;

  return insertInArray(source, childrenOpenBracketIndex, entry, '      ');
}

function buildDomainRepositoryFile(repositoryClassName) {
  return `import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export abstract class ${repositoryClassName} {}
`;
}

function buildDomainApiFile(apiClassName, repositoryClassName) {
  return `import { Injectable } from '@angular/core';
import { ${repositoryClassName} } from './${strings.dasherize(repositoryClassName)}';

@Injectable({ providedIn: 'root' })
export class ${apiClassName} extends ${repositoryClassName} {}
`;
}

function buildDomainApiSpecFile(apiClassName, domainName) {
  return `import { TestBed } from '@angular/core/testing';

import { ${apiClassName} } from './${domainName}-api';

describe('${apiClassName}', () => {
  let service: ${apiClassName};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(${apiClassName});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
`;
}

function buildDomainApiMockFile(apiMockClassName, repositoryClassName) {
  return `import { Injectable } from '@angular/core';
import { ${repositoryClassName} } from './${strings.dasherize(repositoryClassName)}';

@Injectable({ providedIn: 'root' })
export class ${apiMockClassName} extends ${repositoryClassName} {}
`;
}

function buildDataAccessIndex(domainName) {
  return `export * from './${domainName}-repository';
export * from './${domainName}-api';
export * from './${domainName}-api-mock';
`;
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
    const dataAccessRoot = `${domainRoot}/data-access`;
    const repositoryClassName = `${strings.classify(options.name)}Repository`;
    const apiClassName = `${strings.classify(options.name)}Api`;
    const apiMockClassName = `${strings.classify(options.name)}ApiMock`;

    const repositoryPath = `${dataAccessRoot}/${domainName}-repository.ts`;
    const apiPath = `${dataAccessRoot}/${domainName}-api.ts`;
    const apiSpecPath = `${dataAccessRoot}/${domainName}-api.spec.ts`;
    const apiMockPath = `${dataAccessRoot}/${domainName}-api-mock.ts`;
    const dataAccessIndexPath = `${dataAccessRoot}/index.ts`;

    if (!tree.exists(repositoryPath)) {
      tree.create(repositoryPath, buildDomainRepositoryFile(repositoryClassName));
    }
    if (!tree.exists(apiPath)) {
      tree.create(apiPath, buildDomainApiFile(apiClassName, repositoryClassName));
    }
    if (!tree.exists(apiSpecPath)) {
      tree.create(apiSpecPath, buildDomainApiSpecFile(apiClassName, domainName));
    }
    if (!tree.exists(apiMockPath)) {
      tree.create(apiMockPath, buildDomainApiMockFile(apiMockClassName, repositoryClassName));
    }
    if (tree.exists(dataAccessIndexPath)) {
      tree.overwrite(dataAccessIndexPath, buildDataAccessIndex(domainName));
    } else {
      tree.create(dataAccessIndexPath, buildDataAccessIndex(domainName));
    }

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

    const appRoutesPath = 'src/app/app.routes.ts';
    if (!tree.exists(appRoutesPath)) {
      throw new SchematicsException(`File not found: ${appRoutesPath}`);
    }

    const appRoutesSourceBuffer = tree.read(appRoutesPath);
    if (!appRoutesSourceBuffer) {
      throw new SchematicsException(`Could not read: ${appRoutesPath}`);
    }

    const appRoutesSource = appRoutesSourceBuffer.toString('utf-8');
    const updatedAppRoutesSource = ensureDomainInAppRoutes(
      appRoutesSource,
      domainName,
      routeConstName,
    );
    if (updatedAppRoutesSource !== appRoutesSource) {
      tree.overwrite(appRoutesPath, updatedAppRoutesSource);
    }

    return tree;
  };
}

module.exports = createDomainSchematic;
module.exports.default = createDomainSchematic;
