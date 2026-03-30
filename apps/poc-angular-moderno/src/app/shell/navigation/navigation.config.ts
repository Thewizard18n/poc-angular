// app/shell/navigation.config.ts

export const navigationConfig: any[] = [
  { label: 'Mapa', icon: 'map', module: 'mapa', route: '/mapa' },
  {
    label: 'Relatórios',
    icon: 'bar_chart',
    module: 'relatorios',
    hasSub: true,
    route: '/relatorios',
  },
  { label: 'Alertas', icon: 'notifications_active', module: 'alertas', route: '/alertas' },
  { label: 'Financeiro', icon: 'payments', module: 'financeiro', route: '/financeiro' },
  { label: 'Compras', icon: 'folder', module: 'compras', route: '/compras' },
  { label: 'Estoque', icon: 'folder', module: 'estoque', route: '/estoque' },
];
