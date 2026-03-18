import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  version: 1,
  tagging: {
    'apps/poc-angular-moderno/src/app': ['root'],
    'apps/poc-angular-moderno/src/app/shared/ui': ['domain:shared', 'type:ui'],
    'apps/poc-angular-moderno/src/app/shared/ui/<name>': ['domain:shared', 'type:ui'],
    'apps/poc-angular-moderno/src/app/<domain>/feature-<name>': ['domain:<domain>', 'type:feature'],
    'apps/poc-angular-moderno/src/app/<domain>/feature-<name>/<subfolder>': ['domain:<domain>', 'type:feature'],
    'apps/poc-angular-moderno/src/app/<domain>/ui-<name>': ['domain:<domain>', 'type:ui'],
    'apps/poc-angular-moderno/src/app/<domain>/ui-<name>/<subfolder>': ['domain:<domain>', 'type:ui'],
    'apps/poc-angular-moderno/src/app/<domain>/data-access': ['domain:<domain>', 'type:data-access'],
  },
  depRules: {
    'root': ['*'],
    'domain:*': [sameTag, 'domain:shared'],
    'type:feature': ['type:ui', 'type:data-access', 'domain:shared'],
    'type:ui': ['domain:shared'],
    'type:data-access': ['domain:shared'],
    'domain:shared': [],
  },
};