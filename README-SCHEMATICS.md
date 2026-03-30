# Generators locais (Nx)

Este projeto possui uma collection local de generators em `tools/generators/generators.json`.

## Comandos disponiveis (sem scripts npm)

### 1) Criar dominio

```bash
nx g ./tools/generators/generators.json:domain --name <nome-do-dominio>
```

Opcoes:

- `--label <texto-do-menu>`: label no `navigation.config.ts`
- `--icon <material-icon>`: icone no menu
- `--has-sub`: marca item com submenu no menu

Exemplos:

```bash
nx g ./tools/generators/generators.json:domain --name relatorios
nx g ./tools/generators/generators.json:domain --name financeiro --label "Financeiro" --icon "payments"
nx g ./tools/generators/generators.json:domain --name alertas --has-sub
```

O generator `domain` cria:

- `libs/domains/<domain>/data-access` como library Nx
- `libs/domains/<domain>/data-access/src/index.ts`
- `libs/domains/<domain>/data-access/src/lib/<domain>-repository.ts`
- `libs/domains/<domain>/data-access/src/lib/<domain>-api.ts`
- `libs/domains/<domain>/data-access/src/lib/<domain>-api.spec.ts`
- `libs/domains/<domain>/data-access/src/lib/<domain>-api-mock.ts`
- `libs/domains/<domain>/features/.gitkeep`
- `libs/domains/<domain>/ui/.gitkeep`
- `libs/domains/<domain>/<domain>.routes.ts`
- novo item no `apps/poc-angular-moderno/src/app/shell/navigation/navigation.config.ts`
- rota no `apps/poc-angular-moderno/src/app/app.routes.ts`

---

### 2) Criar feature simples

```bash
nx g ./tools/generators/generators.json:feature --name <nome-da-feature> --domain <nome-do-dominio>
```

Exemplo:

```bash
nx g ./tools/generators/generators.json:feature --name veiculos --domain relatorios
```

Cria a feature como library Nx e continua gerando:

- `features/<feature>/src/lib/<feature>.ts`
- `features/<feature>/src/lib/<feature>.html`
- `features/<feature>/src/lib/<feature>.scss`
- `features/<feature>/src/lib/<feature>.spec.ts`
- `features/<feature>/src/index.ts` (exporta o componente)
- adiciona rota no `libs/domains/<domain>/<domain>.routes.ts` via `loadComponent` importando `./features/<feature>/src`

---

### 3) Criar feature com rotas filhas

```bash
nx g ./tools/generators/generators.json:feature --name <nome-da-feature> --domain <nome-do-dominio> --with-routes
```

Exemplo:

```bash
nx g ./tools/generators/generators.json:feature --name passagens --domain relatorios --with-routes
```

Cria:

- todos os arquivos da feature simples
- `features/<feature>/src/lib/<feature>.routes.ts`
- `features/<feature>/src/index.ts` (exporta as rotas)
- adiciona rota no `libs/domains/<domain>/<domain>.routes.ts` via `loadChildren` importando `./features/<feature>/src`

Opcao adicional:

- `--route-path <path-personalizado>` para alterar o `path` da rota adicionada no `<domain>.routes.ts`

---

### 4) Testar sem gerar arquivos (recomendado)

```bash
nx g ./tools/generators/generators.json:domain --name financeiro
nx g ./tools/generators/generators.json:feature --name veiculos --domain relatorios
nx g ./tools/generators/generators.json:feature --name passagens --domain relatorios --with-routes
```

## Como criar esses generators em outra aplicacao Angular

### Passo 1: criar estrutura de pastas

No projeto destino:

```bash
mkdir -p tools/generators/domain
mkdir -p tools/generators/feature
```

### Passo 2: adicionar arquivos da collection

Copie estes arquivos deste projeto para o projeto destino:

- `tools/generators/generators.json`
- `tools/generators/domain/schema.json`
- `tools/generators/domain/index.js`
- `tools/generators/feature/schema.json`
- `tools/generators/feature/index.js`

### Passo 3: executar os generators locais

Use `nx g` apontando para a pasta:

```bash
nx g ./tools/generators/generators.json:domain --name exemplo
nx g ./tools/generators/generators.json:feature --name lista --domain exemplo
```

### Passo 4: garantir arquivos esperados no app destino

Os schematics assumem estes caminhos:

- `apps/poc-angular-moderno/src/app/shell/navigation/navigation.config.ts` (usado por `domain`)
- `libs/domains/<domain>/<domain>.routes.ts` (usado por `feature`)

Se sua estrutura for diferente, ajuste os caminhos nos arquivos:

- `tools/generators/domain/index.js`
- `tools/generators/feature/index.js`

### Passo 5: validar no projeto destino

```bash
nx g ./tools/generators/generators.json:domain --name exemplo
nx g ./tools/generators/generators.json:feature --name lista --domain exemplo
nx g ./tools/generators/generators.json:feature --name detalhe --domain exemplo --with-routes
```
