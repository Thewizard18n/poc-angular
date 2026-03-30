// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const nx = require('@nx/eslint-plugin');
const sheriff = require('@softarc/eslint-plugin-sheriff');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
    ],
    plugins: {
      '@nx': nx,
    },
    processor: angular.processInlineTemplates,
    rules: {
      // desliga regras TypeScript que não interessam agora
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',

      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // boundaries por domínio
            {
              sourceTag: 'domain:sandro',
              onlyDependOnLibsWithTags: ['domain:sandro', 'domain:shared'],
            },
            {
              sourceTag: 'domain:gustavo',
              onlyDependOnLibsWithTags: ['domain:gustavo', 'domain:shared'],
            },
            {
              sourceTag: 'domain:shared',
              onlyDependOnLibsWithTags: ['domain:shared'],
            },
            // boundaries por tipo (hierarquia vertical)
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:ui',
                'type:util',
                'domain:shared',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'domain:shared'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'domain:shared'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'domain:shared'],
            },

            {
              sourceTag: 'domain:bete',
              onlyDependOnLibsWithTags: ['domain:bete', 'domain:shared'],
            },

            {
              sourceTag: 'domain:esther',
              onlyDependOnLibsWithTags: ['domain:esther', 'domain:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
