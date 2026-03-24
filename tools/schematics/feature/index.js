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
    throw new SchematicsException('Could not resolve target array in routes file.');
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
    throw new SchematicsException('Could not resolve target object in toolbar config file.');
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
    throw new SchematicsException('Could not find toolbarTabsConfig in toolbar tabs config.');
  }

  const objectOpenIndex = source.indexOf('{', toolbarConstIndex);
  if (objectOpenIndex === -1) {
    throw new SchematicsException('Could not find toolbar tabs config object start.');
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

  let updatedSource = ensureDomainInToolbarTabsConfig(source, options.domainName);
  const domainKeyIndex = findDomainKeyIndex(updatedSource, options.domainName);
  if (domainKeyIndex === -1) {
    throw new SchematicsException(
      `Could not find "${options.domainName}" entry in toolbar tabs config.`,
    );
  }

  const domainArrayOpenIndex = updatedSource.indexOf('[', domainKeyIndex);
  if (domainArrayOpenIndex === -1) {
    throw new SchematicsException('Could not find domain tabs array in toolbar tabs config.');
  }

  if (updatedSource.includes(`route: '${featureRoute}'`)) {
    return updatedSource;
  }

  if (escapedGroupLabel) {
    const escapedGroupNeedle = `label: '${escapedGroupLabel}'`;
    const groupLabelIndex = updatedSource.indexOf(escapedGroupNeedle, domainArrayOpenIndex);
    const domainArrayCloseIndex = findArrayCloseIndex(updatedSource, domainArrayOpenIndex);
    if (domainArrayCloseIndex === -1) {
      throw new SchematicsException('Could not resolve domain tabs array in toolbar tabs config.');
    }

    if (groupLabelIndex !== -1 && groupLabelIndex < domainArrayCloseIndex) {
      const childrenKeywordIndex = updatedSource.indexOf('children', groupLabelIndex);
      if (childrenKeywordIndex === -1 || childrenKeywordIndex > domainArrayCloseIndex) {
        throw new SchematicsException(
          `Could not find children array for group "${options.group}".`,
        );
      }
      const childrenArrayOpenIndex = updatedSource.indexOf('[', childrenKeywordIndex);
      if (childrenArrayOpenIndex === -1) {
        throw new SchematicsException(
          `Could not find children array start for group "${options.group}".`,
        );
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
    const group = options.group?.trim() || '';
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
    if (!duplicateNeedles.some((needle) => domainRoutesSource.includes(needle))) {
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
    }

    const toolbarTabsConfigPath = 'src/app/shell/navigation/toolbar-tabs.config.ts';
    if (!tree.exists(toolbarTabsConfigPath)) {
      throw new SchematicsException(`File not found: ${toolbarTabsConfigPath}`);
    }

    const toolbarTabsBuffer = tree.read(toolbarTabsConfigPath);
    if (!toolbarTabsBuffer) {
      throw new SchematicsException(`Could not read: ${toolbarTabsConfigPath}`);
    }

    const toolbarTabsSource = toolbarTabsBuffer.toString('utf-8');
    const updatedToolbarTabsSource = updateToolbarTabsConfig(toolbarTabsSource, {
      name: options.name,
      domainName,
      routePath,
      group,
    });
    if (updatedToolbarTabsSource !== toolbarTabsSource) {
      tree.overwrite(toolbarTabsConfigPath, updatedToolbarTabsSource);
    }

    return tree;
  };
}

module.exports = createFeatureSchematic;
module.exports.default = createFeatureSchematic;
