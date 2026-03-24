import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  version: 1,
  tagging: {
    'src/app':                                      ['root'],
    'src/app/shared/ui':                            ['domain:shared', 'type:ui'],
    'src/app/domains/<domain>/features/<name>':      ['domain:<domain>', 'type:feature'],
    'src/app/domains/<domain>/ui/<name>':           ['domain:<domain>', 'type:ui'],
    'src/app/domains/<domain>/data-access':         ['domain:<domain>', 'type:data-access'],
  },
  depRules: {
    'root':             ['*'],
    'domain:*':         [sameTag, 'domain:shared'],
    'type:feature':     ['type:ui', 'type:data-access', 'domain:shared'],
    'type:ui':          ['domain:shared'],
    'type:data-access': ['domain:shared'],
    'domain:shared':    [],
  },
};