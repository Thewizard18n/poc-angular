const { strings } = require('@angular-devkit/core');
const { getProjects, formatFiles } = require('@nx/devkit');
const { libraryGenerator } = require('@nx/angular/generators');

function buildComponentFile(featureName, className, usecaseClassName) {
  return `import { Component, inject } from '@angular/core';
import { ${usecaseClassName} } from './${featureName}-usecase';

@Component({
  selector: 'app-${featureName}',
  imports: [],
  templateUrl: './${featureName}.html',
  styleUrl: './${featureName}.scss',
})
export class ${className} {
  protected readonly usecase = inject(${usecaseClassName});
}
`;
}

function buildComponentSpecFile(featureName, className) {
  return `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${className} } from './${featureName}';

describe('${className}', () => {
  let component: ${className};
  let fixture: ComponentFixture<${className}>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}],
    }).compileComponents();

    fixture = TestBed.createComponent(${className});
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
}

function buildUsecaseFile(usecaseClassName, repositoryClassName) {
  if (!repositoryClassName) {
    return `import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ${usecaseClassName} {}
`;
  }

  return `import { inject, Injectable } from '@angular/core';
import { ${repositoryClassName} } from '../../../../data-access/src';

@Injectable({ providedIn: 'root' })
export class ${usecaseClassName} {
  protected readonly repository = inject(${repositoryClassName});
}
`;
}

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "\\'");
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
    throw new Error('Could not resolve target object in toolbar config file.');
  }

  const beforeClose = content.slice(0, closeIndex);
  const lastSignificantCharMatch = beforeClose.match(/(\S)\s*$/);
  const lastSignificantChar = lastSignificantCharMatch ? lastSignificantCharMatch[1] : '';

  const needsComma = lastSignificantChar && lastSignificantChar !== '{' && lastSignificantChar !== ',';
  const insertion = `${needsComma ? ',' : ''}\n${indent}${entry}\n`;

  return content.slice(0, closeIndex) + insertion + content.slice(closeIndex);
}

function findDomainKeyIndex(source, domainName) {
  const quotedIndex = source.indexOf(`'${domainName}':`);
  if (quotedIndex !== -1) {
    return quotedIndex;
  }
  return source.indexOf(` ${domainName}:`);
}

function ensureDomainInToolbarTabsConfig(source, domainName) {
  if (findDomainKeyIndex(source, domainName) !== -1) {
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

function buildFeatureRoute(domainName, routePath) {
  return routePath ? `/${domainName}/${routePath}` : `/${domainName}`;
}

function updateToolbarTabsConfig(source, options) {
  const featureLabel = strings.classify(options.name);
  const escapedFeatureLabel = escapeSingleQuotes(featureLabel);
  const escapedGroupLabel = options.group ? escapeSingleQuotes(options.group.trim()) : '';
  const featureRoute = buildFeatureRoute(options.domainName, options.routePath);

  const updatedSource = ensureDomainInToolbarTabsConfig(source, options.domainName);
  const domainKeyIndex = findDomainKeyIndex(updatedSource, options.domainName);
  if (domainKeyIndex === -1) {
    throw new Error(`Could not find "${options.domainName}" entry in toolbar tabs config.`);
  }

  const domainArrayOpenIndex = updatedSource.indexOf('[', domainKeyIndex);
  if (domainArrayOpenIndex === -1) {
    throw new Error('Could not find domain tabs array in toolbar tabs config.');
  }

  if (updatedSource.includes(`route: '${featureRoute}'`)) {
    return updatedSource;
  }

  if (escapedGroupLabel) {
    const escapedGroupNeedle = `label: '${escapedGroupLabel}'`;
    const groupLabelIndex = updatedSource.indexOf(escapedGroupNeedle, domainArrayOpenIndex);
    const domainArrayCloseIndex = findArrayCloseIndex(updatedSource, domainArrayOpenIndex);
    if (domainArrayCloseIndex === -1) {
      throw new Error('Could not resolve domain tabs array in toolbar tabs config.');
    }

    if (groupLabelIndex !== -1 && groupLabelIndex < domainArrayCloseIndex) {
      const childrenKeywordIndex = updatedSource.indexOf('children', groupLabelIndex);
      if (childrenKeywordIndex === -1 || childrenKeywordIndex > domainArrayCloseIndex) {
        throw new Error(`Could not find children array for group "${options.group}".`);
      }
      const childrenArrayOpenIndex = updatedSource.indexOf('[', childrenKeywordIndex);
      if (childrenArrayOpenIndex === -1) {
        throw new Error(`Could not find children array start for group "${options.group}".`);
      }

      const childEntry = `{ type: 'link', label: '${escapedFeatureLabel}', route: '${featureRoute}' }`;
      return insertInArray(updatedSource, childrenArrayOpenIndex, childEntry, '        ');
    }

    const groupEntry = `{
      type: 'group',
      label: '${escapedGroupLabel}',
      children: [{ type: 'link', label: '${escapedFeatureLabel}', route: '${featureRoute}' }],
    }`;
    return insertInArray(updatedSource, domainArrayOpenIndex, groupEntry, '    ');
  }

  const featureEntry = `{ type: 'link', label: '${escapedFeatureLabel}', route: '${featureRoute}' }`;
  return insertInArray(updatedSource, domainArrayOpenIndex, featureEntry, '    ');
}

function resolveApplicationProjectConfig(tree) {
  const projects = getProjects(tree);
  const applicationProject = Array.from(projects.values()).find(
    (project) => project.projectType === 'application',
  );

  if (!applicationProject) {
    throw new Error('Could not find any application project in workspace.');
  }

  const sourceRoot = applicationProject.sourceRoot || `${applicationProject.root}/src`;
  return {
    sourceRoot,
    appRoot: `${sourceRoot}/app`,
  };
}

function findProjectByRoot(tree, root) {
  const projects = getProjects(tree);
  return Array.from(projects.entries()).find(([, project]) => project.root === root);
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

async function featureGenerator(tree, options) {
  if (!options?.name) {
    throw new Error('The "name" option is required.');
  }
  if (!options?.domain) {
    throw new Error('The "domain" option is required.');
  }

  const featureName = strings.dasherize(options.name);
  const featureClassName = strings.classify(options.name);
  const usecaseClassName = `${strings.classify(options.name)}Usecase`;
  const domainName = strings.dasherize(options.domain);
  const routePath = options.routePath === '' ? '' : strings.dasherize(options.routePath || featureName);
  const group = options.group?.trim() || '';
  const repositoryName = options.repository
    ? strings.dasherize(options.repository)
    : `${domainName}-repository`;
  const repositoryClassName = strings.classify(repositoryName);
  const withRoutes = options.withRoutes === true;

  const { appRoot } = resolveApplicationProjectConfig(tree);
  const domainRoot = `libs/domains/${domainName}`;
  const featureRoot = `${domainRoot}/features/${featureName}`;
  const featureProjectName = `${domainName}-${featureName}-feature`;

  await ensureLibraryAtRoot(tree, featureRoot, featureProjectName);

  const featureLibRoot = `${featureRoot}/src/lib`;
  const componentTsPath = `${featureLibRoot}/${featureName}.ts`;
  const componentHtmlPath = `${featureLibRoot}/${featureName}.html`;
  const componentScssPath = `${featureLibRoot}/${featureName}.scss`;
  const componentSpecPath = `${featureLibRoot}/${featureName}.spec.ts`;
  const usecasePath = `${featureLibRoot}/${featureName}-usecase.ts`;
  const indexPath = `${featureRoot}/src/index.ts`;
  const featureRoutesPath = `${featureLibRoot}/${featureName}.routes.ts`;
  const defaultLibraryMainTsPath = `${featureLibRoot}/${featureProjectName}.ts`;
  const defaultLibraryMainSpecPath = `${featureLibRoot}/${featureProjectName}.spec.ts`;
  const repositoryFilePath = `${domainRoot}/data-access/src/lib/${repositoryName}.ts`;
  const hasRepository = tree.exists(repositoryFilePath);

  if (!tree.exists(componentTsPath)) {
    tree.write(componentTsPath, buildComponentFile(featureName, featureClassName, usecaseClassName));
  }
  if (!tree.exists(componentHtmlPath)) {
    tree.write(componentHtmlPath, `<p>${featureName} works!</p>\n`);
  }
  if (!tree.exists(componentScssPath)) {
    tree.write(componentScssPath, '');
  }
  if (!tree.exists(componentSpecPath)) {
    tree.write(componentSpecPath, buildComponentSpecFile(featureName, featureClassName));
  }
  if (!tree.exists(usecasePath)) {
    tree.write(
      usecasePath,
      buildUsecaseFile(usecaseClassName, hasRepository ? repositoryClassName : null),
    );
  }

  if (withRoutes) {
    const featureRoutesConstName = `feature${strings.classify(options.name)}Routes`;
    if (!tree.exists(featureRoutesPath)) {
      tree.write(
        featureRoutesPath,
        `import { Routes } from '@angular/router';

export const ${featureRoutesConstName}: Routes = [
  {
    path: '',
    loadComponent: () => import('./${featureName}').then((m) => m.${featureClassName}),
  },
];
`,
      );
    }

    tree.write(indexPath, `export * from './lib/${featureName}.routes';\n`);
  } else {
    tree.write(indexPath, `export * from './lib/${featureName}';\n`);
  }

  if (tree.exists(defaultLibraryMainTsPath)) {
    tree.delete(defaultLibraryMainTsPath);
  }
  if (tree.exists(defaultLibraryMainSpecPath)) {
    tree.delete(defaultLibraryMainSpecPath);
  }

  const domainRoutesPath = `${domainRoot}/${domainName}.routes.ts`;
  if (!tree.exists(domainRoutesPath)) {
    throw new Error(`Domain routes file not found: ${domainRoutesPath}`);
  }

  const domainRoutesBuffer = tree.read(domainRoutesPath);
  if (!domainRoutesBuffer) {
    throw new Error(`Could not read: ${domainRoutesPath}`);
  }

  const domainRoutesSource = domainRoutesBuffer.toString('utf-8');
  const duplicateNeedles = [
    `./features/${featureName}/src`,
    `./features/${featureName}/src/lib/${featureName}`,
    `./features/${featureName}/src/lib/${featureName}.routes`,
  ];
  if (!duplicateNeedles.some((needle) => domainRoutesSource.includes(needle))) {
    const entry = withRoutes
      ? `{
            path: '${routePath}',
            loadChildren: () => import('./features/${featureName}/src').then((m) => m.feature${strings.classify(options.name)}Routes)
        }`
      : `{
            path: '${routePath}',
            loadComponent: () => import('./features/${featureName}/src').then((m) => m.${featureClassName})
        }`;

    let updatedDomainRoutesSource = domainRoutesSource;

    const childrenIndex = domainRoutesSource.indexOf('children');
    if (childrenIndex !== -1) {
      const childrenOpenBracketIndex = domainRoutesSource.indexOf('[', childrenIndex);
      if (childrenOpenBracketIndex === -1) {
        throw new Error(`Could not find children array in ${domainRoutesPath}`);
      }
      updatedDomainRoutesSource = insertInArray(
        domainRoutesSource,
        childrenOpenBracketIndex,
        entry,
        '            ',
      );
    } else {
      const routesOpenBracketIndex = domainRoutesSource.indexOf('[', domainRoutesSource.indexOf('='));
      if (routesOpenBracketIndex === -1) {
        throw new Error(`Could not find routes array in ${domainRoutesPath}`);
      }
      updatedDomainRoutesSource = insertInArray(
        domainRoutesSource,
        routesOpenBracketIndex,
        entry,
        '  ',
      );
    }

    tree.write(domainRoutesPath, updatedDomainRoutesSource);
  }

  const toolbarTabsConfigPath = `${appRoot}/shell/navigation/toolbar-tabs.config.ts`;
  if (!tree.exists(toolbarTabsConfigPath)) {
    throw new Error(`File not found: ${toolbarTabsConfigPath}`);
  }

  const toolbarTabsBuffer = tree.read(toolbarTabsConfigPath);
  if (!toolbarTabsBuffer) {
    throw new Error(`Could not read: ${toolbarTabsConfigPath}`);
  }

  const toolbarTabsSource = toolbarTabsBuffer.toString('utf-8');
  const updatedToolbarTabsSource = updateToolbarTabsConfig(toolbarTabsSource, {
    name: options.name,
    domainName,
    routePath,
    group,
  });
  if (updatedToolbarTabsSource !== toolbarTabsSource) {
    tree.write(toolbarTabsConfigPath, updatedToolbarTabsSource);
  }

  await formatFiles(tree);
}

module.exports = featureGenerator;
module.exports.featureGenerator = featureGenerator;
module.exports.default = featureGenerator;
