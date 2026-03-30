const { strings } = require('@angular-devkit/core');
const { getProjects, formatFiles } = require('@nx/devkit');
const { libraryGenerator } = require('@nx/angular/generators');
const path = require('path');

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
    throw new Error('Could not resolve target array in routes file.');
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
    throw new Error('Could not resolve target object in toolbar config file.');
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
    throw new Error('Could not find toolbarTabsConfig in toolbar tabs config.');
  }

  const objectOpenIndex = source.indexOf('{', toolbarConstIndex);
  if (objectOpenIndex === -1) {
    throw new Error('Could not find toolbar tabs config object start.');
  }

  return insertInObject(source, objectOpenIndex, `'${domainName}': []`, '  ');
}

function ensureDomainInAppRoutes(source, domainName, routeConstName, domainRoutesImportPath) {
  const importNeedle = domainRoutesImportPath;
  if (source.includes(importNeedle) || source.includes(`path: '${domainName}'`)) {
    return source;
  }

  const childrenIndex = source.indexOf('children');
  if (childrenIndex === -1) {
    throw new Error('Could not find children array in app.routes.ts');
  }

  const childrenOpenBracketIndex = source.indexOf('[', childrenIndex);
  if (childrenOpenBracketIndex === -1) {
    throw new Error('Could not find children array start in app.routes.ts');
  }

  const entry = `{
        path: '${domainName}',
        loadChildren: () => import('${domainRoutesImportPath}').then((m) => m.${routeConstName}),
      }`;

  return insertInArray(source, childrenOpenBracketIndex, entry, '      ');
}

function resolveApplicationProjectConfig(tree) {
  const projects = getProjects(tree);
  const applicationProject = Array.from(projects.values()).find(
    (project) => project.projectType === 'application',
  );

  if (!applicationProject) {
    throw new Error('Could not find any application project in workspace.');
  }

  return {
    appRoot: `${applicationProject.sourceRoot || `${applicationProject.root}/src`}/app`,
  };
}

function toImportPath(fromDir, toFileWithoutExtension) {
  const relativePath = path.posix.relative(fromDir, toFileWithoutExtension);
  if (relativePath.startsWith('.')) {
    return relativePath;
  }
  return `./${relativePath}`;
}

function findProjectByRoot(tree, root) {
  const projects = getProjects(tree);
  return Array.from(projects.entries()).find(([, project]) => project.root === root);
}

function ensureProjectTags(tree, projectJsonPath, tags) {
  if (!tree.exists(projectJsonPath)) {
    return;
  }

  const projectJsonBuffer = tree.read(projectJsonPath);
  if (!projectJsonBuffer) {
    throw new Error(`Could not read: ${projectJsonPath}`);
  }

  const projectJson = JSON.parse(projectJsonBuffer.toString('utf-8'));
  projectJson.tags = tags;
  tree.write(projectJsonPath, `${JSON.stringify(projectJson, null, 2)}\n`);
}

function ensureDomainConstraintInEslintConfig(source, domainName) {
  const sourceTagNeedle = `sourceTag: 'domain:${domainName}'`;
  if (source.includes(sourceTagNeedle)) {
    return source;
  }

  const depConstraintsIndex = source.indexOf('depConstraints');
  if (depConstraintsIndex === -1) {
    throw new Error('Could not find depConstraints in eslint.config.js.');
  }

  const depConstraintsOpenBracketIndex = source.indexOf('[', depConstraintsIndex);
  if (depConstraintsOpenBracketIndex === -1) {
    throw new Error('Could not find depConstraints array in eslint.config.js.');
  }

  const domainConstraintEntry = `{
              sourceTag: 'domain:${domainName}',
              onlyDependOnLibsWithTags: ['domain:${domainName}', 'domain:shared'],
            }`;

  return insertInArray(source, depConstraintsOpenBracketIndex, domainConstraintEntry, '            ');
}

async function ensureLibraryAtRoot(tree, root, projectName) {
  const existingProject = findProjectByRoot(tree, root);
  if (existingProject) {
    return existingProject;
  }

  const projectsBefore = new Set(Array.from(getProjects(tree).keys()));
  await libraryGenerator(tree, {
    name: projectName,
    directory: root,
    standalone: false,
    skipModule: true,
    skipTests: true,
    skipFormat: true,
    linter: 'none',
    unitTestRunner: 'none',
  });

  const projectsAfter = getProjects(tree);
  const createdProject =
    findProjectByRoot(tree, root) ||
    Array.from(projectsAfter.entries()).find(([projectName]) => !projectsBefore.has(projectName));
  if (!createdProject) {
    throw new Error(`Could not resolve generated library project for root "${root}".`);
  }

  return createdProject;
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
  return `export * from './lib/${domainName}-repository';
export * from './lib/${domainName}-api';
export * from './lib/${domainName}-api-mock';
`;
}

async function domainGenerator(tree, options) {
  if (!options?.name) {
    throw new Error('The "name" option is required.');
  }

  const domainName = strings.dasherize(options.name);
  const defaultLabel = strings.classify(options.name);
  const label = options.label?.trim() || defaultLabel;
  const icon = options.icon?.trim() || 'folder';
  const hasSub = options.hasSub === true;

  const { appRoot } = resolveApplicationProjectConfig(tree);
  const domainRoot = `libs/domains/${domainName}`;
  const dataAccessRoot = `${domainRoot}/data-access`;
  const repositoryClassName = `${strings.classify(options.name)}Repository`;
  const apiClassName = `${strings.classify(options.name)}Api`;
  const apiMockClassName = `${strings.classify(options.name)}ApiMock`;

  await ensureLibraryAtRoot(tree, dataAccessRoot, `${domainName}-data-access`);
  ensureProjectTags(tree, `${dataAccessRoot}/project.json`, [
    `domain:${domainName}`,
    'type:data-access',
  ]);

  const dataAccessLibRoot = `${dataAccessRoot}/src/lib`;
  const repositoryPath = `${dataAccessLibRoot}/${domainName}-repository.ts`;
  const apiPath = `${dataAccessLibRoot}/${domainName}-api.ts`;
  const apiSpecPath = `${dataAccessLibRoot}/${domainName}-api.spec.ts`;
  const apiMockPath = `${dataAccessLibRoot}/${domainName}-api-mock.ts`;
  const dataAccessIndexPath = `${dataAccessRoot}/src/index.ts`;
  const legacyDataAccessIndexPath = `${dataAccessRoot}/index.ts`;
  const legacyRepositoryPath = `${dataAccessRoot}/${domainName}-repository.ts`;
  const legacyApiPath = `${dataAccessRoot}/${domainName}-api.ts`;
  const legacyApiSpecPath = `${dataAccessRoot}/${domainName}-api.spec.ts`;
  const legacyApiMockPath = `${dataAccessRoot}/${domainName}-api-mock.ts`;
  const defaultStandaloneRoot = `${dataAccessRoot}/src/lib/data-access`;
  const defaultComponentTsPath = `${defaultStandaloneRoot}/data-access.ts`;
  const defaultComponentHtmlPath = `${defaultStandaloneRoot}/data-access.html`;
  const defaultComponentCssPath = `${defaultStandaloneRoot}/data-access.css`;
  const defaultComponentScssPath = `${defaultStandaloneRoot}/data-access.scss`;
  const featuresGitkeepPath = `${domainRoot}/features/.gitkeep`;
  const uiGitkeepPath = `${domainRoot}/ui/.gitkeep`;

  if (!tree.exists(repositoryPath)) {
    tree.write(repositoryPath, buildDomainRepositoryFile(repositoryClassName));
  }
  if (!tree.exists(apiPath)) {
    tree.write(apiPath, buildDomainApiFile(apiClassName, repositoryClassName));
  }
  if (!tree.exists(apiSpecPath)) {
    tree.write(apiSpecPath, buildDomainApiSpecFile(apiClassName, domainName));
  }
  if (!tree.exists(apiMockPath)) {
    tree.write(apiMockPath, buildDomainApiMockFile(apiMockClassName, repositoryClassName));
  }
  tree.write(dataAccessIndexPath, buildDataAccessIndex(domainName));
  if (tree.exists(defaultComponentTsPath)) {
    tree.delete(defaultComponentTsPath);
  }
  if (tree.exists(defaultComponentHtmlPath)) {
    tree.delete(defaultComponentHtmlPath);
  }
  if (tree.exists(defaultComponentCssPath)) {
    tree.delete(defaultComponentCssPath);
  }
  if (tree.exists(defaultComponentScssPath)) {
    tree.delete(defaultComponentScssPath);
  }
  if (tree.exists(legacyDataAccessIndexPath)) {
    tree.delete(legacyDataAccessIndexPath);
  }
  if (tree.exists(legacyRepositoryPath)) {
    tree.delete(legacyRepositoryPath);
  }
  if (tree.exists(legacyApiPath)) {
    tree.delete(legacyApiPath);
  }
  if (tree.exists(legacyApiSpecPath)) {
    tree.delete(legacyApiSpecPath);
  }
  if (tree.exists(legacyApiMockPath)) {
    tree.delete(legacyApiMockPath);
  }
  if (!tree.exists(featuresGitkeepPath)) {
    tree.write(featuresGitkeepPath, '');
  }
  if (!tree.exists(uiGitkeepPath)) {
    tree.write(uiGitkeepPath, '');
  }

  const routeConstName = `${strings.camelize(domainName)}Routes`;
  const routesFilePath = `${domainRoot}/${domainName}.routes.ts`;
  if (!tree.exists(routesFilePath)) {
    tree.write(
      routesFilePath,
      `import { Routes } from '@angular/router';\n\nexport const ${routeConstName}: Routes = [];\n`,
    );
  }

  const navigationConfigPath = `${appRoot}/shell/navigation/navigation.config.ts`;
  if (!tree.exists(navigationConfigPath)) {
    throw new Error(`File not found: ${navigationConfigPath}`);
  }

  const navigationSourceBuffer = tree.read(navigationConfigPath);
  if (!navigationSourceBuffer) {
    throw new Error(`Could not read: ${navigationConfigPath}`);
  }

  const navigationSource = navigationSourceBuffer.toString('utf-8');
  if (!navigationSource.includes(`module: '${domainName}'`)) {
    const navItem = `  { label: '${escapeSingleQuotes(label)}', icon: '${escapeSingleQuotes(icon)}', module: '${domainName}',${hasSub ? ' hasSub: true,' : ''} route: '/${domainName}' },\n`;

    const arrayEndIndex = navigationSource.lastIndexOf('];');
    if (arrayEndIndex === -1) {
      throw new Error(`Could not find navigation array end in ${navigationConfigPath}`);
    }

    const updatedNavigationSource =
      navigationSource.slice(0, arrayEndIndex) +
      navItem +
      navigationSource.slice(arrayEndIndex);

    tree.write(navigationConfigPath, updatedNavigationSource);
  }

  const toolbarTabsConfigPath = `${appRoot}/shell/navigation/toolbar-tabs.config.ts`;
  if (!tree.exists(toolbarTabsConfigPath)) {
    throw new Error(`File not found: ${toolbarTabsConfigPath}`);
  }

  const toolbarTabsSourceBuffer = tree.read(toolbarTabsConfigPath);
  if (!toolbarTabsSourceBuffer) {
    throw new Error(`Could not read: ${toolbarTabsConfigPath}`);
  }

  const toolbarTabsSource = toolbarTabsSourceBuffer.toString('utf-8');
  const updatedToolbarTabsSource = ensureDomainInToolbarTabsConfig(
    toolbarTabsSource,
    domainName,
  );
  if (updatedToolbarTabsSource !== toolbarTabsSource) {
    tree.write(toolbarTabsConfigPath, updatedToolbarTabsSource);
  }

  const appRoutesPath = `${appRoot}/app.routes.ts`;
  if (!tree.exists(appRoutesPath)) {
    throw new Error(`File not found: ${appRoutesPath}`);
  }

  const appRoutesSourceBuffer = tree.read(appRoutesPath);
  if (!appRoutesSourceBuffer) {
    throw new Error(`Could not read: ${appRoutesPath}`);
  }

  const appRoutesSource = appRoutesSourceBuffer.toString('utf-8');
  const domainRoutesImportPath = toImportPath(`${appRoot}`, `${domainRoot}/${domainName}.routes`);
  const updatedAppRoutesSource = ensureDomainInAppRoutes(
    appRoutesSource,
    domainName,
    routeConstName,
    domainRoutesImportPath,
  );
  if (updatedAppRoutesSource !== appRoutesSource) {
    tree.write(appRoutesPath, updatedAppRoutesSource);
  }

  const eslintConfigPath = 'eslint.config.js';
  if (!tree.exists(eslintConfigPath)) {
    throw new Error(`File not found: ${eslintConfigPath}`);
  }

  const eslintConfigBuffer = tree.read(eslintConfigPath);
  if (!eslintConfigBuffer) {
    throw new Error(`Could not read: ${eslintConfigPath}`);
  }

  const eslintConfigSource = eslintConfigBuffer.toString('utf-8');
  const updatedEslintConfigSource = ensureDomainConstraintInEslintConfig(eslintConfigSource, domainName);
  if (updatedEslintConfigSource !== eslintConfigSource) {
    tree.write(eslintConfigPath, updatedEslintConfigSource);
  }

  await formatFiles(tree);
}

module.exports = domainGenerator;
module.exports.domainGenerator = domainGenerator;
module.exports.default = domainGenerator;
