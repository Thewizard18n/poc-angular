export type ToolbarTab = ToolbarTabLink | ToolbarTabGroup;

export interface ToolbarTabLink {
  type: 'link';
  label: string;
  route: string;
}

export interface ToolbarTabGroup {
  type: 'group';
  label: string;
  children: ToolbarTabLink[];
}

export const toolbarTabsConfig: Record<string, ToolbarTab[]> = {
  mapa: [
    { type: 'link', label: 'Dashboard', route: '/mapa' },
    {
      type: 'group',
      label: 'Frutas',
      children: [
        { type: 'link', label: 'Banana', route: '/mapa/banana' },
        { type: 'link', label: 'Maca', route: '/mapa/maca' },
      ],
    },
  ],
  relatorios: [
    { type: 'link', label: 'Veiculos', route: '/relatorios' },
    { type: 'link', label: 'Passagens', route: '/relatorios/passagens' },
    {
      type: 'group',
      label: 'Outros',
      children: [{ type: 'link', label: 'Teste', route: '/relatorios/teste' }],
    },
  ],

  'financeiro': [
    { type: 'link', label: 'Veiculos', route: '/financeiro/veiculos' }
,
    {
      type: 'group',
      label: 'pagamentos',
      children: [{ type: 'link', label: 'Resumo', route: '/financeiro/resumo' },
        { type: 'link', label: 'Teste', route: '/financeiro/teste' }
],
    }
]
,
  'compras': [
    { type: 'link', label: 'Consultar', route: '/compras/consultar' }
,
    {
      type: 'group',
      label: 'Operacoes',
      children: [{ type: 'link', label: 'Aprovar', route: '/compras/aprovar' }],
    }
]
,
  'estoque': []
};
