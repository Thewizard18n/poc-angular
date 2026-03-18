import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  version: 1,
  tagging: {
    'src/app': ['root'],
    'src/app/shared/ui': ['domain:shared', 'type:ui'],
    'src/app/<domain>/feature-<name>': ['domain:<domain>', 'type:feature'],
    'src/app/<domain>/ui-<name>': ['domain:<domain>', 'type:ui'],
    'src/app/<domain>/data-access': ['domain:<domain>', 'type:data-access'],
  },
  depRules: {
    // root acessa tudo
    'root': ['*'],

    // cada domínio só acessa akkl si mesmo e shared
    'domain:*': [sameTag, 'domain:shared'],

    // feature acessa ui, data-access e shared
    'type:feature': ['type:ui', 'type:data-access', 'domain:shared'],

    // ui acessa apenas shared
    'type:ui': ['domain:shared'],

    // data-access acessa apenas shared
    'type:data-access': ['domain:shared'],

    // shared não depende de ninguém
    'domain:shared': [],
  },
};