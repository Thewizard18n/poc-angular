# POC: Material 3 — mapeamento de tonal palette para system roles

Crie um projeto Angular 21 standalone que sirva como POC visual de como a tonal
palette do Material 3 alimenta os system color roles e como esses roles são
consumidos por componentes reais do Angular Material.

## Contexto e objetivo

A POC tem um propósito didático: alinhar dev e designer sobre o modelo de cor do
Material 3. A ideia central que ela precisa deixar óbvia é que **componentes não
usam tons diretamente — usam roles (`--mat-sys-*`), e cada role aponta para um tom
da palette tonal**. Mexer no tom OU reapontar o role deve refletir nos componentes
ao vivo.

## Stack obrigatória

- Angular 21+ (standalone components, sem NgModule)
- Signals como reatividade primária, zoneless
- `@angular/material` (versão compatível com Angular 21)
- SCSS para theming via `mat.theme` e `mat.theme-overrides`
- ChangeDetectionStrategy.OnPush em todos os componentes

## Minha tonal palette (primary)

Use EXATAMENTE estes tons como a palette primary da POC. Não invente valores,
não gere uma palette nova — use estes:

<<<<<<<<<< COLE SEU TONAL AQUI >>>>>>>>>>

primary: (
0: #000000,
10: ...,
20: ...,
... (cole o resto)
100: #ffffff,
)

<<<<<<<<<< FIM DO TONAL >>>>>>>>>>

Se eu colei mais de uma palette (secondary, tertiary, etc.), use todas. Se colei só
a primary, foque nela.

## O que a tela precisa ter

Layout em duas colunas:

### Lado esquerdo — palette tonal

- Liste todos os tons (0–100) como linhas: swatch da cor + número do tom + hex.
- Dois modos de edição, alternáveis por um toggle no topo:
  1. **Editar hex do tom**: clico num tom e edito o hex direto (color picker +
     campo de texto). Isso muda a matéria-prima — todos os roles que apontam para
     aquele tom mudam junto.
  2. **Reapontar role→tom**: a palette fica fixa; troco via dropdown qual tom cada
     role aponta. Muda só aquele papel, palette intacta.

### Meio — mapeamento role → tom

Mostre os quatro roles de primary com o tom que cada um consome:

- `primary` (light: tom 40)
- `on-primary` (light: tom 100)
- `primary-container` (light: tom 90)
- `on-primary-container` (light: tom 30)

Cada linha: nome do role + swatch da cor resultante + qual tom aponta.

### Lado direito — componentes REAIS do Angular Material

Renderize componentes de verdade do `@angular/material`, não reproduções em CSS:

- `<button mat-flat-button>` (filled) — usa primary / on-primary
- `<button mat-stroked-button>` (outlined) — usa primary na borda e texto
- `<mat-chip>` ou chip selecionado — usa primary-container / on-primary-container

Os componentes devem reagir às edições ao vivo, aplicando os valores via
`mat.theme-overrides` (ou sobrescrevendo as variáveis `--mat-sys-*` em runtime).

### Canto — painel de variáveis CSS ao vivo

Mostre as variáveis `--mat-sys-*` atuais com seus valores hex, atualizando a cada
mudança. Esse painel representa o que o Angular Material escreve no `:root`.

## Theming — pontos importantes

- Aplique o tema base no elemento raiz (`html`) com `mat.theme`.
- Para customizações pontuais de role, use `mat.theme-overrides` — NÃO edite tons
  crus do tema nem mire seletores internos dos componentes.
- A POC é só light theme.
- Regra de contraste: sempre que um fundo usa um role, o texto em cima usa o `on-`
  correspondente. Deixe isso explícito no código.

## Entregáveis

1. Projeto Angular 21 rodável (`ng serve`).
2. `styles.scss` com `mat.theme` configurado a partir do meu tonal.
3. Component standalone com a tela descrita (duas colunas + painel de variáveis).
4. README curto explicando como rodar e como a edição ao vivo funciona.

## Antes de começar

Me explique em 3–4 linhas como você vai estruturar o projeto e como vai aplicar a
edição ao vivo das variáveis (via theme-overrides recompilado vs. manipulação
direta das CSS custom properties em runtime), pra eu confirmar a abordagem antes de
você gerar tudo.
