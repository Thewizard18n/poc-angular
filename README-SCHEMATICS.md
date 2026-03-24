# Schematics locais (Angular CLI)

Este projeto possui uma collection local de schematics em `tools/schematics/collection.json`.

## Comandos disponiveis (sem scripts npm)

### 1) Criar dominio

```bash
ng g domain --name <nome-do-dominio>
```

Opcoes:

- `--label <texto-do-menu>`: label no `navigation.config.ts`
- `--icon <material-icon>`: icone no menu
- `--has-sub`: marca item com submenu no menu

Exemplos:

```bash
ng g domain --name relatorios
ng g domain --name financeiro --label "Financeiro" --icon "payments"
ng g domain --name alertas --has-sub
```

O schematic `domain` cria:

- `src/app/domains/<domain>/data-access/.gitkeep`
- `src/app/domains/<domain>/features/.gitkeep`
- `src/app/domains/<domain>/ui/.gitkeep`
- `src/app/domains/<domain>/<domain>.routes.ts`
- novo item no `src/app/shell/navigation/navigation.config.ts`

---

### 2) Criar feature simples

```bash
ng g feature --name <nome-da-feature> --domain <nome-do-dominio>
```

Exemplo:

```bash
ng g feature --name veiculos --domain relatorios
```

Cria:

- `features/<feature>/<feature>.ts`
- `features/<feature>/<feature>.html`
- `features/<feature>/<feature>.scss`
- `features/<feature>/<feature>.spec.ts`
- `features/<feature>/index.ts` (exporta o componente)
- adiciona rota no `src/app/domains/<domain>/<domain>.routes.ts` via `loadComponent` importando `./features/<feature>`

---

### 3) Criar feature com rotas filhas

```bash
ng g feature --name <nome-da-feature> --domain <nome-do-dominio> --with-routes
```

Exemplo:

```bash
ng g feature --name passagens --domain relatorios --with-routes
```

Cria:

- todos os arquivos da feature simples
- `features/<feature>/<feature>.routes.ts`
- `features/<feature>/index.ts` (exporta as rotas)
- adiciona rota no `src/app/domains/<domain>/<domain>.routes.ts` via `loadChildren` importando `./features/<feature>`

Opcao adicional:

- `--route-path <path-personalizado>` para alterar o `path` da rota adicionada no `<domain>.routes.ts`

---

### 4) Testar sem gerar arquivos (recomendado)

```bash
ng g domain --name financeiro --dry-run
ng g feature --name veiculos --domain relatorios --dry-run
ng g feature --name passagens --domain relatorios --with-routes --dry-run
```

## Como criar esses schematics em outra aplicacao Angular

### Passo 1: criar estrutura de pastas

No projeto destino:

```bash
mkdir -p tools/schematics/domain
mkdir -p tools/schematics/feature
```

### Passo 2: adicionar arquivos da collection

Copie estes arquivos deste projeto para o projeto destino:

- `tools/schematics/collection.json`
- `tools/schematics/domain/schema.json`
- `tools/schematics/domain/index.js`
- `tools/schematics/feature/schema.json`
- `tools/schematics/feature/index.js`

### Passo 3: registrar a collection no `angular.json`

Em `angular.json`, adicionar no bloco `cli.schematicCollections`:

```json
"cli": {
  "schematicCollections": [
    "./tools/schematics/collection.json",
    "angular-eslint"
  ]
}
```

Se seu projeto nao usa `angular-eslint`, mantenha apenas as collections que voce usa.

### Passo 4: garantir arquivos esperados no app destino

Os schematics assumem estes caminhos:

- `src/app/shell/navigation/navigation.config.ts` (usado por `domain`)
- `src/app/domains/<domain>/<domain>.routes.ts` (usado por `feature`)

Se sua estrutura for diferente, ajuste os caminhos nos arquivos:

- `tools/schematics/domain/index.js`
- `tools/schematics/feature/index.js`

### Passo 5: validar no projeto destino

```bash
ng g domain --name exemplo --dry-run
ng g feature --name lista --domain exemplo --dry-run
ng g feature --name detalhe --domain exemplo --with-routes --dry-run
```

Se o `dry-run` estiver correto, execute sem `--dry-run`.
