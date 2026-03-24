const { strings } = require('@angular-devkit/core');
const { SchematicsException } = require('@angular-devkit/schematics');

function buildComponentFile(featureName, className) {
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${featureName}',
  imports: [],
  templateUrl: './${featureName}.html',
  styleUrl: './${featureName}.scss',
})
export class ${className} {}
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

function createFeatureSchematic(options) {
  return (tree) => {
    if (!options?.name) {
      throw new SchematicsException('The "name" option is required.');
    }
    if (!options?.domain) {
      throw new SchematicsException('The "domain" option is required.');
    }

    const featureName = strings.dasherize(options.name);
    const featureClassName = strings.classify(options.name);
    const domainName = strings.dasherize(options.domain);
    const routePath = options.routePath === '' ? '' : strings.dasherize(options.routePath || featureName);
    const withRoutes = options.withRoutes === true;

    const domainRoot = `src/app/domains/${domainName}`;
    const featureRoot = `${domainRoot}/features/${featureName}`;

    const componentTsPath = `${featureRoot}/${featureName}.ts`;
    const componentHtmlPath = `${featureRoot}/${featureName}.html`;
    const componentScssPath = `${featureRoot}/${featureName}.scss`;
    const componentSpecPath = `${featureRoot}/${featureName}.spec.ts`;
    const indexPath = `${featureRoot}/index.ts`;
    const featureRoutesPath = `${featureRoot}/${featureName}.routes.ts`;

    if (!tree.exists(componentTsPath)) {
      tree.create(componentTsPath, buildComponentFile(featureName, featureClassName));
    }
    if (!tree.exists(componentHtmlPath)) {
      tree.create(componentHtmlPath, `<p>${featureName} works!</p>\n`);
    }
    if (!tree.exists(componentScssPath)) {
      tree.create(componentScssPath, '');
    }
    if (!tree.exists(componentSpecPath)) {
      tree.create(componentSpecPath, buildComponentSpecFile(featureName, featureClassName));
    }

    if (withRoutes) {
      const featureRoutesConstName = `feature${strings.classify(options.name)}Routes`;
      if (!tree.exists(featureRoutesPath)) {
        tree.create(
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

      if (tree.exists(indexPath)) {
        tree.overwrite(indexPath, `export * from './${featureName}.routes';\n`);
      } else {
        tree.create(indexPath, `export * from './${featureName}.routes';\n`);
      }
    } else {
      if (tree.exists(indexPath)) {
        tree.overwrite(indexPath, `export * from './${featureName}';\n`);
      } else {
        tree.create(indexPath, `export * from './${featureName}';\n`);
      }
    }

    const domainRoutesPath = `${domainRoot}/${domainName}.routes.ts`;
    if (!tree.exists(domainRoutesPath)) {
      throw new SchematicsException(`Domain routes file not found: ${domainRoutesPath}`);
    }

    const domainRoutesBuffer = tree.read(domainRoutesPath);
    if (!domainRoutesBuffer) {
      throw new SchematicsException(`Could not read: ${domainRoutesPath}`);
    }

    const domainRoutesSource = domainRoutesBuffer.toString('utf-8');
    const duplicateNeedles = [
      `./features/${featureName}`,
      `./features/${featureName}/${featureName}`,
      `./features/${featureName}/${featureName}.routes`,
    ];
    if (duplicateNeedles.some((needle) => domainRoutesSource.includes(needle))) {
      return tree;
    }

    const entry = withRoutes
      ? `{
            path: '${routePath}',
            loadChildren: () => import('./features/${featureName}').then((m) => m.feature${strings.classify(options.name)}Routes)
        }`
      : `{
            path: '${routePath}',
            loadComponent: () => import('./features/${featureName}').then((m) => m.${featureClassName})
        }`;

    let updatedDomainRoutesSource = domainRoutesSource;

    const childrenIndex = domainRoutesSource.indexOf('children');
    if (childrenIndex !== -1) {
      const childrenOpenBracketIndex = domainRoutesSource.indexOf('[', childrenIndex);
      if (childrenOpenBracketIndex === -1) {
        throw new SchematicsException(
          `Could not find children array in ${domainRoutesPath}`,
        );
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
        throw new SchematicsException(`Could not find routes array in ${domainRoutesPath}`);
      }
      updatedDomainRoutesSource = insertInArray(
        domainRoutesSource,
        routesOpenBracketIndex,
        entry,
        '  ',
      );
    }

    tree.overwrite(domainRoutesPath, updatedDomainRoutesSource);

    return tree;
  };
}

module.exports = createFeatureSchematic;
module.exports.default = createFeatureSchematic;
