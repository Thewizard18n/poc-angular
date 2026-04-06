# Design System Architecture

## Visao geral

Este Design System cria uma camada fina e sustentavel sobre Angular Material 21.
A estrategia prioriza:

- tokens semanticos centralizados;
- integracao direta com Material 3 (sem API paralela);
- primitives opinadas e pequenas para casos repetidos;
- composicao e content projection para customizacao;
- uso direto do Material para componentes complexos.

## Estrutura de pastas

```text
src/app/design-system/
  ui-tokens/
  ui-material-adapters/
  ui-primitives/
  ui-patterns/
  docs/
```

### ui-tokens

Responsavel por tokens semanticos e variações de tema:

- cores (`--ds-color-*`);
- tipografia (`--ds-typography-*`);
- dimensoes (`--ds-spacing-*`, `--ds-radius-*`, `--ds-elevation-*`);
- tema claro e escuro;
- aliases de compatibilidade para variaveis antigas.

### ui-material-adapters

Camada de conexao com Angular Material:

- aplicacao de tema Material 3 com `mat.theme()`;
- mapear tema claro/escuro para tokens do DS;
- overrides globais pequenos e controlados.

Nao centraliza hacks pesados de CSS interno dos componentes.

### ui-primitives

Componentes opinados, com API pequena e estavel:

- `ds-button`
- `ds-text-field`
- `ds-card`
- `ds-empty-state`

Todos standalone e `OnPush`.

### ui-patterns

Padroes compostos e reutilizaveis:

- `ds-confirm-dialog` (com service simples para abertura).

### docs

Documentacao e showcase para o time usar como referencia viva.

## Decisoes de arquitetura

### 1) Onde usar Material direto

Material deve ser usado diretamente quando o componente tem API extensa ou alto risco de virar espelho:

- `mat-table`
- `mat-select`
- `mat-autocomplete`
- `mat-datepicker`
- `mat-menu`
- `mat-tree`

Esses componentes ficam no dominio e recebem somente tokens/tema globais.

### 2) Onde encapsular

Encapsulamos apenas componentes estaveis e opinados:

- botoes com variantes fixas;
- campo de texto padrao;
- card base;
- estado vazio;
- confirm dialog padrao.

Se um wrapper comecar a pedir dezenas de inputs/outputs para cobrir Material, ele deve ser removido/refatorado.

### 3) Tokens e custom properties

Os componentes consumem tokens semanticos (`--ds-color-primary`, `--ds-typography-body-medium`, etc.).
Valores concretos e escalas ficam centralizados em `ui-tokens`.

### 4) Tema claro/escuro

Suporte nativo desde o inicio:

- default no `:root` (light);
- dark ativado por `[data-theme='dark']`.

## Convencoes de uso

- Sempre preferir tokens semanticos em vez de hardcode de cor/spacing.
- APIs de primitives devem ser pequenas, focadas em intencao.
- Para customizacao, preferir:
  - content projection;
  - templates;
  - diretivas leves;
  - variants controladas.

## Trade-offs assumidos

- `ds-text-field` cobre o caso mais comum de input, sem tentar representar todos os recursos de `mat-form-field`.
- `ds-button` nao expoe toda a API de `mat-button`; ele padroniza visual e comportamento essencial (variant, size, loading).
- aliases legados foram mantidos para migracao gradual sem quebra.

## O que NAO fazer

- Nao criar wrappers genericos para componentes complexos do Material.
- Nao espalhar overrides locais de Material em features.
- Nao hardcodar estilos visuais dentro de componentes de dominio.

## Exemplo rapido

```html
<ds-card title="Relatorio">
  <ds-text-field label="Email" type="email" />
  <ds-button variant="primary">Salvar</ds-button>
</ds-card>
```
