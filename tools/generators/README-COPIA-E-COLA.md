# Como portar os generators para outro projeto (copia e cola)

Este guia mostra o passo a passo para levar os generators locais de `domain` e `feature` para outro workspace Nx.

## O que esses generators fazem

- `domain`:
  - cria `libs/domains/<domain>/data-access`
  - define `tags` no `project.json` do data-access:
    - `domain:<domain>`
    - `type:data-acess`
  - atualiza `eslint.config.js` em `depConstraints` com:
    - `sourceTag: 'domain:<domain>'`
    - `onlyDependOnLibsWithTags: ['domain:<domain>', 'domain:shared']`
- `feature`:
  - cria `libs/domains/<domain>/features/<feature>`
  - define `tags` no `project.json` da feature:
    - `domain:<domain>`
    - `type:feature`

## 1) Pre-requisitos no projeto destino

Confirme que o projeto destino possui:

- workspace Nx configurado
- `@nx/angular` instalado
- `@nx/devkit` e `@angular-devkit/core` disponíveis no projeto
- arquivo `eslint.config.js` na raiz (se quiser usar a insercao automatica de `depConstraints`)

## 2) Copiar arquivos dos generators

No projeto destino, crie a estrutura:

```bash
mkdir -p tools/generators/domain
mkdir -p tools/generators/feature
```

Copie estes arquivos deste projeto para o destino:

- `tools/generators/generators.json`
- `tools/generators/domain/index.js`
- `tools/generators/domain/schema.json`
- `tools/generators/feature/index.js`
- `tools/generators/feature/schema.json`

## 3) Adicionar scripts no `package.json` (opcional, recomendado)

No `package.json` do projeto destino:

```json
{
  "scripts": {
    "domain": "nx g ./tools/generators/generators.json:domain",
    "feature": "nx g ./tools/generators/generators.json:feature"
  }
}
```

## 4) Garantir estrutura esperada no app destino

Os generators assumem que existe:

- `app.routes.ts` dentro do app principal (detectado via `sourceRoot`)
- `shell/navigation/navigation.config.ts`
- `shell/navigation/toolbar-tabs.config.ts`

Se seu projeto usa nomes/caminhos diferentes, ajuste manualmente em:

- `tools/generators/domain/index.js`
- `tools/generators/feature/index.js`

## 5) Rodar os generators no projeto destino

Criar dominio:

```bash
npm run domain -- --name financeiro
```

Criar feature:

```bash
npm run feature -- --name resumo --domain financeiro
```

Criar feature com rotas filhas:

```bash
npm run feature -- --name detalhe --domain financeiro --with-routes
```

Sem scripts npm, use direto:

```bash
nx g ./tools/generators/generators.json:domain --name financeiro
nx g ./tools/generators/generators.json:feature --name resumo --domain financeiro
```

## 6) Checklist de validacao

Depois de executar, valide:

- `libs/domains/<domain>/data-access/project.json` contem:
  - `"tags": ["domain:<domain>", "type:data-acess"]`
- `libs/domains/<domain>/features/<feature>/project.json` contem:
  - `"tags": ["domain:<domain>", "type:feature"]`
- `eslint.config.js` recebeu a constraint do novo dominio em `depConstraints`
- app continua compilando/lintando:

```bash
nx lint
nx build
```

## 7) Problemas comuns

- **Nao atualizou `eslint.config.js`**
  - verifique se o arquivo existe na raiz e se contem a chave `depConstraints`.
- **Nao encontrou arquivos de navigation**
  - ajuste os caminhos hardcoded no generator para o layout do projeto destino.
- **Tags diferentes do esperado**
  - confirme se o dominio foi passado no `--domain`/`--name` e se o `project.json` foi gerado pela execucao atual.
