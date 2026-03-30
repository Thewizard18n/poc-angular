# PocAngularModerno

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Generators customizados

Este projeto possui generators locais Nx.

### Comandos de dominio

Criar dominio:

```bash
nx g ./tools/generators/generators.json:domain --name <nome-do-dominio>
```

Opcoes:

- `--label "<texto>"` define o label do menu lateral
- `--icon "<material-icon>"` define icone do menu lateral
- `--has-sub` marca item com submenu

Exemplo:

```bash
nx g ./tools/generators/generators.json:domain --name financeiro --label "Financeiro" --icon "payments" --has-sub
```

### Comandos de feature

Criar feature simples:

```bash
nx g ./tools/generators/generators.json:feature --name <nome-da-feature> --domain <nome-do-dominio>
```

Criar feature com rotas internas:

```bash
nx g ./tools/generators/generators.json:feature --name <nome-da-feature> --domain <nome-do-dominio> --with-routes
```

Opcoes:

- `--route-path <path>` define o path da rota no `<domain>.routes.ts`
- `--group "<nome-do-grupo>"` adiciona a feature em um grupo de tabs da toolbar (cria o grupo se nao existir)
- `--repository <arquivo-ou-classe>` escolhe o repository para injetar no usecase

Exemplos:

```bash
nx g ./tools/generators/generators.json:feature --name veiculos --domain relatorios
nx g ./tools/generators/generators.json:feature --name passagens --domain relatorios --with-routes
nx g ./tools/generators/generators.json:feature --name analitico --domain financeiro --group "Indicadores"
nx g ./tools/generators/generators.json:feature --name aprovar --domain financeiro --repository financeiro-api-mock
```

### Testar sem gerar arquivos

```bash
nx g ./tools/generators/generators.json:domain --name compras
nx g ./tools/generators/generators.json:feature --name resumo --domain financeiro
```
