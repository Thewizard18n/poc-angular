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
};
