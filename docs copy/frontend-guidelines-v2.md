# Diretrizes desenvolvimento frontend — Angular moderno

## Introdução

Este documento define como organizar, nomear, testar e evoluir o código frontend em projetos Angular sem Nx, com alvo no Angular 21 e versões posteriores. O objetivo é eliminar decisões repetidas no dia a dia, reduzir o acoplamento entre partes do sistema e dar ao time uma referência única.

A arquitetura se organiza em dois eixos. O eixo vertical divide o sistema em **domínios de negócio** isolados. O eixo horizontal divide cada domínio em quatro **camadas técnicas**: `features/` (orquestra casos de uso), `ui/` (componentes visuais reutilizáveis entre as features), `data-access/` (acesso a dados e estado) e `utils/` (utilitários técnicos). O cruzamento desses eixos forma a matriz de arquitetura, ponto de partida de qualquer decisão estrutural.

Sete decisões sustentam o guia:

- **Repository Pattern** — uma `abstract class` é o contrato entre a feature e o acesso a dados. Permite trocar a implementação por um mock nos testes sem subir HTTP.
- **Observable em `data-access/`, Signal em features** — Observables ficam confinados à camada de dados; `toSignal()` é a única fronteira de conversão. O template nunca vê Observable, `.subscribe()` ou `async` pipe.
- **Use Cases** — ações que orquestram mais de uma chamada ou side effect saem do componente e vão para um use case em `internal/`. O componente cuida só do estado de UI.
- **Adapter Pattern** — toda lib de terceiro é encapsulada por uma interface própria. Trocar a lib muda apenas o adapter.
- **Anti-corruption Layer** — quando um domínio recebe dados de outro via evento, a tradução é centralizada em `internal/`. A linguagem do domínio consumidor não vaza para fora.
- **Information hiding via `internal/`** — código privado fica em `internal/`; sem barrels (`index.ts`). O Sheriff garante que ninguém importe o que é privado.
- **Nomenclatura de métodos por intenção** — verbos padronizados (`findAll`, `create`, `load`, `reset`) tornam o código legível sem ler a implementação.

O guia tem 14 seções sobre a arquitetura e anti-padrões. Cada regra é marcada como **MUST** (obrigatória, CI bloqueia), **SHOULD** (recomendada, desvio documentado no PR) ou **MAY** (opcional). A versão operacional para desenvolvimento com IA estará no `CLAUDE.md`.

---

## 0. Como usar este guia

Este documento é a fonte da verdade para decisões de arquitetura. A versão enxuta para agentes de IA estará no `CLAUDE.md` na raiz do repositório.

| Nível      | Significado                                                     |
| ---------- | --------------------------------------------------------------- |
| **MUST**   | Obrigatório. O CI bloqueia o merge se violado.                  |
| **SHOULD** | Padrão recomendado. Desvie com justificativa documentada no PR. |
| **MAY**    | Opcional. Escolha conforme o contexto.                          |

**Princípio guia:** Comece com o código próximo de onde é usado; generalize só quando uma segunda parte do sistema precisar dele.

---

## 1. Visão geral da arquitetura

### 1.1 Objetivos

A primeira pergunta natural é: por que toda essa estrutura? Por que não simplesmente criar componentes e telas conforme a necessidade for surgindo?

A resposta está no que acontece quando um projeto cresce. Um componente criado para uma tela específica começa a ser reutilizado em outras, carregando consigo lógicas que não pertencem àquele contexto.

Esta arquitetura existe para evitar exatamente isso. Ela foi pensada para que o projeto possa crescer em funcionalidades, em tamanho de time e em complexidade de negócio.

Os principais objetivos são:

- **Modularidade** — o sistema é dividido em partes pequenas e substituíveis.
- **Isolamento de domínios** — uma mudança no Domínio A não quebra o Domínio B.
- **Testabilidade** — cada parte pode ser testada isoladamente.
- **Baixo acoplamento e alta coesão** — o que muda junto fica junto; o que é independente não se enxerga.
- **Carga cognitiva reduzida** — trabalhar em uma área de forma individualizada.

### 1.2 Princípios gerais

- **SRP** — cada arquivo e classe tem uma única responsabilidade.
- **Dependências unidirecionais** — fluem em uma direção: camadas de cima dependem das de baixo, nunca o contrário. Isso elimina ciclos.
- **Componentização** — a UI é feita de peças pequenas e combináveis. Componentes apresentacionais não conhecem regra de negócio.
- **Information hiding** — cada módulo expõe uma API pública mínima e esconde o resto.

**Baixo acoplamento e alta coesão — o que significa na prática**

São dois lados da mesma moeda. A pergunta que revela os dois é:

> *"Se a regra de negócio X mudar, quais arquivos vou precisar tocar?"*

**Alta coesão** — arquivos que mudam pelo mesmo motivo ficam juntos.

❌ Baixa coesão — organizado por tipo técnico:
```
src/
├── components/
│   └── feature-x-form.ts      # mexe aqui
├── validators/
│   └── feature-x-validator.ts # mexe aqui
└── services/
    └── feature-x-service.ts   # mexe aqui
```
Uma mudança obriga a navegar por 3 pastas diferentes.

✅ Alta coesão — organizado por motivo de mudança:
```
features/feature-x/
├── feature-x.ts
├── feature-x-form.ts
└── internal/
    └── feature-x-validator.ts
```
Tudo que muda junto está junto. Uma pasta, uma mudança.

**Baixo acoplamento** — domínios independentes não se enxergam.

```mermaid
flowchart LR
    subgraph "✅ baixo acoplamento"
        DA["domain-a"]
        DB["domain-b"]
        SH["shared/utils/x"]
        DA -->|"usa"| SH
        DB -->|"usa"| SH
        DA -.->|"❌ nunca importa"| DB
    end
```

Uma mudança em `domain-a` não quebra `domain-b`. Quando precisam de algo em comum, buscam em `shared/` — nunca um do outro.

| Princípio | Pergunta | Resultado |
|---|---|---|
| Alta coesão | *O que muda junto?* | Fica junto na mesma feature/domínio |
| Baixo acoplamento | *O que é independente?* | Fica separado e não se enxerga |

### 1.3 Modelo mental: a matriz de arquitetura

A arquitetura cruza dois eixos ortogonais: verticais (domínios de negócio) e camadas (tipos de módulo).

```mermaid
flowchart TB
    subgraph DA["DOMÍNIO A"]
        direction TB
        DAF["features/ (smart)"] --> DAU["ui/ (dumb)"]
        DAF --> DAD["data-access/ (repositório + API)"]
        DAU --> DAD
        DAD --> DAUT["utils/"]
    end
    subgraph DB["DOMÍNIO B"]
        direction TB
        DBF["features/"] --> DBU["ui/"]
        DBF --> DBD["data-access/"]
        DBD --> DBUT["utils/"]
    end
    subgraph Shared["SHARED (técnico)"]
        direction TB
        SU["ui/"]
        SUT["utils/ (auth, log, adapters)"]
    end
    DA --> Shared
    DB --> Shared
```

| Camada           | Responsabilidade                                                                     | Regra de negócio? | Backend?           |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------- | ------------------ |
| **features/**    | Orquestra um caso de uso. Smart components, rotas, composição de estado.             | Sim               | Via `data-access/` |
| **ui/**          | Componentes apresentacionais reutilizáveis. Comunicação só por `input()`/`output()`. | Não               | Não                |
| **data-access/** | Repositório (abstração), implementação de API, modelo de domínio, estado.            | Sim               | Sim                |
| **utils/**       | Funções técnicas genéricas: datas, logging, auth helpers, adapters de libs.          | Não               | Não                |

Duas regras derivam da matriz: (1) um domínio só fala com seus próprios módulos e com `shared`; (2) cada módulo só acessa camadas abaixo.

---

## 2. Estrutura de pastas

### 2.1 Visão geral do workspace

Verticais e camadas são representadas por pastas. A estrutura física espelha a matriz de arquitetura. Cada camada é uma pasta-mãe (`features/`, `ui/`, `data-access/`, `utils/`) dentro do domínio.

```
src/
├── app/
│   ├── domains/
│   │   ├── domain-a/
│   │   │   ├── features/
│   │   │   │   └── feature-x/
│   │   │   │       ├── internal/
│   │   │   │       │   ├── entity-a-api.ts
│   │   │   │       │   ├── entity-a-api.mock.ts
│   │   │   │       │   ├── entity-a-repository.ts
│   │   │   │       │   └── action-x.use-case.ts
│   │   │   │       ├── feature-x.ts
│   │   │   │       ├── feature-x.html
│   │   │   │       ├── feature-x.css
│   │   │   │       └── feature-x.spec.ts
│   │   │   ├── ui/
│   │   │   │   └── card-a/
│   │   │   │       ├── card-a.ts
│   │   │   │       └── card-a.spec.ts
│   │   │   ├── data-access/
│   │   │   │   └── entity-a/
│   │   │   │       ├── internal/
│   │   │   │       │   ├── http-mapper.ts
│   │   │   │       │   └── entity-validation.ts
│   │   │   │       ├── entity-a.ts
│   │   │   │       ├── entity-a-repository.ts
│   │   │   │       └── entity-a-api.ts
│   │   │   └── utils/
│   │   │       └── formatting/
│   │   │           └── date-formatter.ts
│   │   ├── domain-b/
│   │   └── shared/
│   │       ├── ui/
│   │       │   ├── button/
│   │       │   └── modal/
│   │       └── utils/
│   │           ├── auth/
│   │           │   ├── auth-store.ts
│   │           │   ├── auth-interceptor.ts
│   │           │   └── auth-guard.ts
│   │           ├── http/
│   │           │   ├── http-context.ts
│   │           │   └── error-interceptor.ts
│   │           └── adapters/
│   │               ├── analytics-adapter.ts
│   │               └── internal/
│   │                   └── analytics-impl.ts
│   ├── app.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── main.ts
└── styles.css
```

### 2.2 Pasta de domínios

- Cada domínio é uma subpasta de `src/app/domains/`. **MUST:** o nome é um conceito de negócio, nunca técnico (`components`, `services`).
- Dentro do domínio, as pastas `features/`, `ui/`, `data-access/` e `utils/` agrupam os módulos pela camada. A posição na matriz é legível só pela estrutura de diretórios.

### 2.3 Pasta `shared`

`shared` é um domínio especial para código reutilizável e técnico, sem regra de negócio.

- **Entra:** design system (`ui/`), interceptors genéricos, guards de auth, adapters de libs, helpers de formatação.
- **Não entra:** modelo de domínio, regra de negócio, serviços de contexto específico.

> **Anti-padrão crítico:** `shared` inchado. Se a maior parte do código vira "compartilhado", o acoplamento global volta. `shared` deve ser pequeno.

### 2.4 Information hiding (`internal/`, sem barrel) — MUST

**O que é information hiding**

Information hiding é o princípio de **esconder decisões de implementação**. Cada módulo expõe só o necessário para quem usa — o resto é detalhe interno, livre para mudar sem afetar ninguém de fora.

A pergunta que define o que vai em `internal/` é sempre:

> *"Isso é um **como** (detalhe de implementação) ou um **quê** (contrato público)?"*

- É um **"como"** → vai para `internal/`
- É um **"quê"** → fica na raiz do nível

**`internal/` tem dois valores dependendo do contexto**

| Contexto | Valor técnico (Sheriff bloqueia imports) | Valor semântico (comunica intenção) |
|---|---|---|
| `data-access/`, `ui/`, `utils/`, `shared/` | ✅ sim — bloqueia imports indevidos | ✅ sim |
| `features/` | ❌ Sheriff já protege a feature inteira | ✅ sim — esconde o *como* do *quê* |

Dentro de uma feature, `internal/` não adiciona proteção extra do Sheriff — ele já impede que outros módulos importem de dentro de uma feature. Mas comunica claramente ao time o que é essência da feature vs. detalhe de implementação — seguindo o princípio de information hiding de Parnas: esconder o *como* e expor apenas o *quê*.

**`internal/` se repete em qualquer nível da estrutura**

O padrão não é exclusivo das camadas do domínio. Ele se aplica em cascata — domínio, feature e rota filha seguem a mesma lógica:

```mermaid
flowchart TB
    subgraph Dominio["Domínio"]
        subgraph DA["data-access/entity-a/"]
            DAI["internal/\nhttp-mapper\nbuild-query-params"]
            DAP["entity-a-repository.ts\nentity-a-api.ts\nentity-a.ts"]
        end
        subgraph Feature["features/feature-x/"]
            FI["internal/\nentity-a-api\nentity-a-repository\naction-x.use-case"]
            FP["feature-x.ts\nfeature-x.routes.ts"]
            subgraph Child["steps/step-y/"]
                CI["internal/\nstep-y-api\nstep-y-repository"]
                CP["step-y.ts"]
            end
        end
    end

    DAI -. "escondido" .- DAP
    FI -. "escondido" .- FP
    CI -. "escondido" .- CP
```

**Regra simples para o time**

| O que é | Onde fica |
|---|---|
| API, repository, mock, helpers, mappers, use cases | `internal/` |
| Smart component, rotas, contratos públicos | raiz do nível |

Sem `index.ts`: barrels quebram tree-shaking e lazy loading. O Sheriff (Seção 13) garante que outros módulos não importem de `internal/`.

### 2.5 Path mappings — MUST

**Por que path mappings existem**

Sem path mapping, imports dependem da localização física do arquivo no disco:

```ts
// ❌ frágil — quebra ao mover arquivos
import { EntityARepository } from '../../../data-access/entity-a/entity-a-repository';
```

O `../../../` significa *"sobe três pastas a partir de onde estou"*. Se qualquer arquivo nesse caminho for movido, o import quebra — e você precisa corrigir em todos os lugares que usam.

Com path mapping, o import reflete a **posição na arquitetura**, não no sistema de arquivos:

```ts
// ✅ estável — reflete domínio e camada
import { EntityARepository } from '@app/domain-a/data-access/entity-a/entity-a-repository';
```

| Benefício | Por quê |
|---|---|
| **Legibilidade** | Você lê o import e sabe imediatamente em qual domínio e camada o recurso vive |
| **Refatoração segura** | Mova arquivos à vontade — os imports continuam funcionando |
| **Arquitetura visível** | Um import errado entre domínios fica evidente antes mesmo do Sheriff barrar |

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": { "@app/*": ["src/app/domains/*"] }
  }
}
```

### 2.6 Regras de dependência (boundaries) — MUST

```mermaid
flowchart LR
    DA["Domínio A"] -. "proibido" .-> DB["Domínio B"]
    DA -->|"permitido"| SH["shared"]
    DB -->|"permitido"| SH
```

```mermaid
flowchart TB
    F["features/"] --> U["ui/"]
    F --> D["data-access/"]
    F --> UT["utils/"]
    U --> D
    U --> UT
    D --> UT
```

1. **Entre domínios:** só importa do próprio domínio e de `shared`.
2. **Entre camadas:** `features/` → `ui/`, `data-access/`, `utils/`; `ui/` → `data-access/`, `utils/`; `data-access/` → `utils/`; `utils/` → nada.
3. **API pública:** nunca importe de `internal/` de outro módulo.
4. **Sem ciclos** — as regras anteriores tornam ciclos impossíveis por construção.

Comunicação entre domínios é por eventos ou contratos em `shared/`, nunca import direto.

---

## 3. Domínios e módulos de feature

### 3.1 Anatomia de um domínio

Um domínio agrupa casos de uso relacionados sobre o mesmo modelo. Sinais de que algo é um domínio próprio:

- **Linguagem:** o mesmo termo com significado diferente indica contextos distintos.
- **Responsabilidades:** papéis diferentes tendem a domínios diferentes.
- **Eventos pivô:** pontos de virada difíceis de desfazer marcam fronteiras.

> Não existe fronteira perfeita. Decida com o time e refatore se a análise (Seção 13) mostrar acoplamento indevido.

### 3.2 Camadas dentro do domínio

Ao criar código, classifique a camada primeiro (o que isto faz?), depois o domínio (a qual negócio pertence?). A camada define a pasta-mãe; o domínio define onde dentro de `domains/`.

### 3.3 Standalone-first, roteamento e lazy loading — MUST

Componentes são standalone. Não crie `NgModule`. Features são carregadas com lazy loading: cada domínio só é baixado quando a rota é acessada.

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'domain-a' },
  {
    path: 'domain-a',
    loadChildren: () =>
      import('@app/domain-a/features/feature-x/feature-x.routes')
        .then((m) => m.featureXRoutes),
  },
];

// domain-a/features/feature-x/feature-x.routes.ts
export const featureXRoutes: Routes = [
  {
    path: '',
    providers: [
      EntityAStore,
      { provide: EntityARepository, useClass: EntityAApi }
    ],
    loadComponent: () => import('./feature-x').then((m) => m.FeatureX),
  },
];
```

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as Router
    participant Bk as bundle domain-a (lazy)
    B->>R: navega para /domain-a
    R->>Bk: import() dinâmico (1a vez)
    Bk-->>R: routes + Component
    R-->>B: renderiza feature
```

### 3.4 Route-level providers

Serviços e stores que só fazem sentido dentro de uma feature são providos na rota, não em `providedIn: 'root'`. Isso escopa o estado ao tempo de vida da rota e libera memória ao sair.

```ts
{
  path: 'domain-a',
  providers: [EntityAStore],
  loadChildren: () => import('...').then(m => m.featureXRoutes),
}
```

### 3.5 Feature-local vs. promovido

Comece com tudo local à feature. O gatilho para promover é sempre um **segundo consumidor real** — nunca uma antecipação de reutilização futura.

```mermaid
flowchart LR
    A["1️⃣ Nasce dentro\nda feature\n\nfeatures/feature-x/\ninternal/helper-fn.ts"]
    B["2️⃣ Segunda feature\ndo mesmo domínio precisa\n\ndomain-a/\nutils/helpers/helper-fn.ts"]
    C["3️⃣ Segundo domínio\nprecisa\n\nshared/\nutils/helpers/helper-fn.ts"]

    A -->|"feature-y\ntambém precisa"| B
    B -->|"domain-b\ntambém precisa"| C
```

| Situação | Onde fica |
|---|---|
| Só uma feature usa | `features/feature-x/internal/` |
| Duas ou mais features do mesmo domínio usam | `domain-a/utils/` ou `domain-a/data-access/` |
| Dois ou mais domínios usam | `shared/` |

> **Erro mais comum:** promover antes de existir um segundo consumidor real — o *"talvez alguém precise um dia"*. Isso infla o `shared/` e recria o acoplamento global que a arquitetura tenta evitar. Se você está promovendo sem um segundo consumidor concreto na mão, **não promova ainda**.

### 3.6 Limites entre domínios

- **MUST:** proibido import entre domínios (Sheriff reporta no editor e no CI).
- Comunicação entre domínios é por eventos ou contratos em `shared/`.
- Estado contextual mínimo (usuário logado, filtros globais) vive em `shared/utils/`.

**Anti-corruption Layer — protegendo a linguagem do domínio**

Quando um domínio recebe dados de outro via evento, os dois frequentemente têm linguagens diferentes para o mesmo conceito. Sem um ponto de tradução centralizado, a linguagem do domínio emissor vaza para dentro do domínio consumidor — e uma mudança no contrato obriga a corrigir em vários lugares.

A solução é um **Anti-corruption Layer (ACL)** — uma função de tradução em `internal/` do domínio que consome:

```mermaid
flowchart LR
    subgraph DA["domain-a (emissor)"]
        EV["EntityASelectedEvent\nfieldOne: string\nfieldTwo: number"]
    end

    subgraph DB["domain-b (consumidor)"]
        ACL["internal/domain-a-acl.ts\n← único ponto de tradução"]
        F1["features/feature-x ✅ não conhece domain-a"]
        F2["features/feature-y ✅ não conhece domain-a"]
    end

    DA -->|"evento via event-bus"| ACL
    ACL --> F1
    ACL --> F2
```

```
domain-b/
├── features/
│   └── feature-x/
│       └── feature-x.ts       # só conhece EntityB
└── data-access/
    └── entity-b/
        ├── internal/
        │   └── domain-a-acl.ts  # tradução aqui — único ponto de mudança
        └── entity-b.ts
```

```ts
// domain-b/data-access/entity-b/internal/domain-a-acl.ts
export function toEntityB(event: EntityASelectedEvent): EntityB {
  return {
    id:    event.fieldOne,
    value: event.fieldTwo,
  };
}
```

**O que o ACL protege e o que não protege**

| Situação | ACL resolve? |
|---|---|
| Mudança no contrato afeta muitos lugares dentro do domínio | ✅ sim — sempre um único lugar para atualizar |
| Mudança no contrato obriga atualizar nos dois domínios | ❌ não — isso é responsabilidade da governança de contratos |

---

## 4. Componentes e UI

### 4.1 Smart (container) vs. Dumb (presentational)

```mermaid
flowchart LR
    Repo["Repository (data-access/)"] -->|"Observable<T>"| Store["Store / Feature\nconverte com toSignal"]
    Store -->|"signal()"| Smart["Smart Component\nfeatures/"]
    Smart -->|"input()"| Dumb["Dumb Component\nui/"]
    Dumb -->|"output()"| Smart
    Smart -->|"chama método"| Store
```

|                          | Smart (features/)   | Dumb (ui/)              |
| ------------------------ | ------------------- | ----------------------- |
| Conhece o caso de uso    | Sim                 | Não                     |
| Acessa store/repositório | Sim                 | Nunca                   |
| Comunicação              | Injeta dependências | Só `input()`/`output()` |
| Reutilizável             | Pouco               | Muito                   |

### 4.2 Componentes reutilizáveis — MUST

Componentes em `ui/` se comunicam apenas por `input()`/`output()`. Não injetam `HttpClient`, repository, store, nem conhecem domínio.

```ts
// shared/ui/card/card.ts
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <button (click)="select.emit()">Selecionar</button>
    </article>
  `,
})
export class Card {
  title = input.required<string>();
  description = input<string>('');
  select = output<void>();
}
```

### 4.3 OnPush — MUST em todos os componentes

`ChangeDetectionStrategy.OnPush` é obrigatório. No Angular 21 zoneless, a detecção não é mais automática via Zone.js. Só Signals + OnPush garantem renderização determinística e mínima: o Angular atualiza apenas as ligações cujo signal dependente mudou.

### 4.4 Template moderno — MUST

Use `@if`/`@for`/`@switch`. Não use `*ngIf`/`*ngFor` (legado). Use `@defer` para conteúdo não-crítico ou pesado.

```html
@if (items().length) {
  @for (item of items(); track item.id) {
    <app-card [title]="item.title" (select)="onItemSelected(item)" />
  }
} @else {
  <p>Nenhum item encontrado.</p>
}

@defer (on viewport) {
  <app-detail-view [item]="selected()" />
} @placeholder {
  <div class="skeleton"></div>
}
```

> O `track` no `@for` é obrigatório. Sem ele, o Angular recria os nós do DOM a cada mudança.

---

## 5. Estado e reatividade

### 5.1 Regra de ouro: Observable na `data-access/`, Signal na feature

Observables ficam confinados à camada `data-access/`. O componente só conhece Signal. `toSignal()` é a fronteira obrigatória de conversão.

```mermaid
flowchart LR
    subgraph DL["Camada data-access/"]
        HC["HttpClient"] -->|"pipe operators"| A["EntityAApi"]
        A --> R["EntityARepository\nabstract class"]
    end
    TS["toSignal()"]
    subgraph FL["Feature"]
        SG["signal()"] --> TPL["Template (@if, @for)"]
        CS["computed()"] --> TPL
    end
    R -->|"Observable<T>"| TS -->|"Signal<T>"| SG
```

| Use Signals para...                 | Use RxJS/Observable para...                |
| ----------------------------------- | ------------------------------------------ |
| Estado atual, leitura pelo template | Stream de eventos ao longo do tempo        |
| Valores derivados (`computed`)      | Debounce, throttle, retry, combinar fontes |
| Estado de UI (loading, seleção)     | Operações canceláveis (`switchMap`)        |
| Comunicação com o template          | Permanecer na camada `data-access/`        |

**Regra absoluta — o componente nunca usa `.subscribe()` ou `async` pipe**

```mermaid
flowchart TB
    A["Observable chega no componente"]
    A -->|"❌ NEVER"| B[".subscribe()"]
    A -->|"❌ NEVER"| C["async pipe"]
    A -->|"✅ MUST"| D["toSignal()"]
```

`.subscribe()` exige gerenciamento manual de unsubscribe — fonte de memory leak. `async` pipe mistura dois paradigmas no template — signals em alguns lugares e `async` pipe em outros. O time perde consistência e não sabe qual padrão seguir.

### 5.2 Escada de estado

Adote a solução mais simples que resolve o problema. Suba um degrau só quando o atual não bastar.

```mermaid
flowchart TB
    L["1. signal() local\nno componente"] -->|"segunda feature precisa?"| F["2. Serviço com signals\nprovido na rota"]
    F -->|"múltiplos domínios?"| S["3. Signal Store\nquando a dor justificar"]
```

Para times em formação, os degraus 1 e 2 cobrem a maioria dos casos. Um serviço com signals provido na rota já é um store, sem biblioteca nova.

```ts
// data-access/entity-a/entity-a-store.ts  — degrau 2: serviço com signals
@Injectable()
export class EntityAStore {
  private repo = inject(EntityARepository);

  private _items   = signal<EntityA[]>([]);
  private _loading = signal(false);

  readonly items   = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly count   = computed(() => this._items().length);

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      this._items.set(await firstValueFrom(this.repo.findAll()));
    } finally {
      this._loading.set(false);
    }
  }
}
```

### 5.3 `computed`, `effect` e imutabilidade

- **`computed`** para derivar estado. Memoizado, recalcula só quando uma dependência muda. **MUST:** derivações vão em `computed`, nunca recalculadas à mão.
- **`effect`** apenas para side-effects externos (log, localStorage, libs). **MUST NOT:** usar `effect` para derivar ou setar outro signal; use `computed`.
- **MUST:** trate o estado como imutável. Substitua o valor, não mute no lugar. No zoneless, mutação no lugar pode não atualizar a tela.

```ts
// ❌ Errado: mutação no lugar
this._items().push(novoItem);

// ✅ Correto: novo array
this._items.update((list) => [...list, novoItem]);
```

### 5.4 Use Cases — quando criar e onde moram

O componente tem uma única responsabilidade: cuidar do estado de UI — `loading`, erros, signals. Quando uma ação envolve orquestrar múltiplas chamadas ou side effects, essa lógica vai para um **Use Case** em `internal/` da feature.

```mermaid
flowchart LR
    subgraph Componente["features/feature-x/feature-x.ts"]
        S["signals — loading, error"]
        H["handlers — dispara e trata UI"]
    end

    subgraph UC["features/feature-x/internal/action-x.use-case.ts"]
        O["orquestra chamadas e side effects"]
    end

    subgraph Repo["Repositórios"]
        R1["EntityARepository"]
        R2["EntityBRepository"]
    end

    H --> UC
    UC --> R1
    UC --> R2
```

**Quando criar um Use Case**

| Situação | Solução |
|---|---|
| Uma chamada só, retorno void | `async` + `firstValueFrom` no componente — **MAY** |
| Duas ou mais chamadas encadeadas | Use Case — **SHOULD** |
| Regra de negócio na ação | Use Case — **MUST** |
| Side effects junto com chamadas | Use Case — **SHOULD** |

**Exemplo — ação simples sem use case**

```ts
// features/feature-x/feature-x.ts
export class FeatureX {
  private repo = inject(EntityARepository);

  loading = signal(false);
  error   = signal<string | null>(null);

  async onActionTriggered(): Promise<void> {
    this.loading.set(true);
    try {
      await firstValueFrom(this.repo.create(this.form()));
    } catch {
      this.error.set('Erro ao executar ação');
    } finally {
      this.loading.set(false);
    }
  }
}
```

**Exemplo — duas chamadas encadeadas com use case**

```ts
// features/feature-x/internal/action-x.use-case.ts
@Injectable()
export class ActionXUseCase {
  private repoA = inject(EntityARepository);
  private repoB = inject(EntityBRepository);

  execute(payload: EntityAPayload): Observable<EntityB> {
    return this.repoA.create(payload).pipe(
      switchMap(entityA => this.repoB.process(entityA.id))
    );
  }
}
```

```ts
// features/feature-x/feature-x.ts — componente limpo
export class FeatureX {
  private useCase = inject(ActionXUseCase);

  loading = signal(false);
  error   = signal<string | null>(null);

  async onActionTriggered(): Promise<void> {
    this.loading.set(true);
    try {
      await firstValueFrom(this.useCase.execute(this.form()));
    } catch {
      this.error.set('Erro ao executar ação');
    } finally {
      this.loading.set(false);
    }
  }
}
```

**Exemplo — switchMap reativo com use case**

Quando o encadeamento precisa reagir a mudanças de signal:

```ts
// features/feature-x/feature-x.ts
export class FeatureX {
  private useCase = inject(LoadEntityDetailsUseCase);

  selectedId = signal<string | null>(null);

  details = toSignal(
    toObservable(this.selectedId).pipe(
      filter(id => id !== null),
      switchMap(id => this.useCase.execute(id!))
    ),
    { initialValue: null }
  );

  onItemSelected(id: string): void {
    this.selectedId.set(id);
  }
}
```

> **Atenção:** `toSignal()` deve ser chamado dentro de um contexto de injeção (campo de classe ou construtor). Chamá-lo dentro de um método causa erro em runtime.

---

## 6. Acesso a dados e HTTP

### 6.1 Repository Pattern — a abstração da camada `data-access/` — MUST

A camada `data-access/` de cada domínio expõe um repositório como `abstract class`. A feature injeta o repositório (o contrato), nunca a implementação concreta. A implementação (que faz HTTP) é provida via DI.

Por que `abstract class` e não interface TypeScript? Interfaces somem em runtime e não podem ser usadas como token de injeção sem `InjectionToken` extra. `abstract class` sobrevive ao compilador e funciona direto no DI.

```mermaid
flowchart TB
    Feature["Feature Component"] -->|"inject(EntityARepository)"| Repo["EntityARepository\nabstract class — contrato"]
    Repo -->|"implementa"| RealApi["EntityAApi\nHTTP real"]
    Repo -->|"implementa"| MockApi["EntityAApiMock\ntestes"]
    RealApi --> HC["HttpClient"]
```

```ts
// domain-a/data-access/entity-a/entity-a-repository.ts  — CONTRATO (público)
export abstract class EntityARepository {
  abstract findAll(): Observable<EntityA[]>;
  abstract findById(id: string): Observable<EntityA>;
  abstract create(data: Partial<EntityA>): Observable<EntityA>;
  abstract update(id: string, data: Partial<EntityA>): Observable<EntityA>;
  abstract remove(id: string): Observable<void>;
}
```

```ts
// domain-a/data-access/entity-a/entity-a-api.ts  — IMPLEMENTAÇÃO (público)
@Injectable()
export class EntityAApi extends EntityARepository {
  private http = inject(HttpClient);
  private url  = '/api/entity-a';

  findAll(): Observable<EntityA[]> {
    return this.http.get<EntityADto[]>(this.url).pipe(
      map((dtos) => dtos.map(toEntityA))  // toEntityA vem de internal/
    );
  }
  findById(id: string): Observable<EntityA> {
    return this.http.get<EntityADto>(`${this.url}/${id}`).pipe(map(toEntityA));
  }
  create(data: Partial<EntityA>): Observable<EntityA> {
    return this.http.post<EntityADto>(this.url, data).pipe(map(toEntityA));
  }
  update(id: string, data: Partial<EntityA>): Observable<EntityA> {
    return this.http.put<EntityADto>(`${this.url}/${id}`, data).pipe(map(toEntityA));
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

```ts
// Provendo no DI — na rota da feature
providers: [
  EntityAStore,
  { provide: EntityARepository, useClass: EntityAApi },
];
```

### 6.2 `toSignal()` — a ponte obrigatória

A conversão de Observable para Signal acontece uma única vez, no ponto de entrada do componente ou store. O Observable não aparece em nenhum outro lugar da feature.

```ts
// Uso simples: o store disponibiliza signals
export class FeatureX {
  private store = inject(EntityAStore);
  readonly items   = this.store.items;
  readonly loading = this.store.loading;

  onItemSelected(item: EntityA): void {
    this.store.select(item);
  }
}

// Uso com operadores RxJS — conversão imediata na fronteira
export class FeatureX {
  private repo = inject(EntityARepository);

  query   = signal('');
  loading = signal(false);

  items = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((q) => q.length > 1),
      switchMap((q) => {
        this.loading.set(true);
        return this.repo.findAll().pipe(
          map((items) => items.filter((i) => i.title.includes(q))),
          catchError(() => of([])),
          finalize(() => this.loading.set(false))
        );
      })
    ),
    { initialValue: [] }
  );
}
```

> **Atenção:** `toSignal()` deve ser chamado dentro de um contexto de injeção. Se o Observable puder errar, adicione `catchError` upstream — sem ele, o signal lança no template.

### 6.3 Auth token e headers globais — MUST

Token e headers transversais via interceptor, nunca em cada serviço.

```ts
// shared/utils/auth/auth-interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

### 6.4 Tratamento de erros

**A divisão de responsabilidades**

```mermaid
flowchart TB
    E["Erro HTTP"] --> Q{"Quem trata?"}
    Q -->|"401, 500, rede"| G["Interceptor global\ntoast / redirect / log"]
    Q -->|"422, regra de negócio\nespecífica da tela"| L["Tratado na feature\ncatchError + signal"]
```

| Erro | Quem trata | Como |
|---|---|---|
| 401 | Interceptor global | Redirect para login |
| 500, rede | Interceptor global | Toast genérico |
| 422, validação | Feature | Mensagem específica no campo |
| Conflito de negócio | Feature | Feedback contextual |

**Por quê dividir:** se tudo for global, perde-se contexto e a UX fica genérica. Se tudo for local, repete-se código.

**O problema — interceptor sem distinção engole tudo**

Com um interceptor genérico, a feature nunca vê o 422:

```ts
// ❌ interceptor sem distinção — engole tudo
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      toast.error('Algo deu errado');  // 422 vira toast genérico
      return throwError(() => error);
    })
  );
};
```

**A solução — contexto HTTP como opt-out**

A feature sinaliza que quer tratar o erro localmente. O interceptor respeita o sinal e deixa passar.

**Passo 1 — Token de contexto em `shared/`:**

```ts
// shared/utils/http/http-context.ts
export const HANDLE_ERROR_LOCALLY = new HttpContextToken<boolean>(() => false);
```

**Passo 2 — Interceptor respeita o contexto:**

```ts
// shared/utils/http/error-interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (req.context.get(HANDLE_ERROR_LOCALLY)) {
        return throwError(() => error);  // deixa passar para a feature
      }
      if (error.status === 401) {
        inject(Router).navigate(['/login']);
      } else {
        inject(ToastService).error('Algo deu errado. Tente novamente.');
      }
      return throwError(() => error);
    })
  );
};
```

**Passo 3 — API passa o contexto na chamada:**

```ts
// features/feature-x/internal/entity-a-api.ts
create(data: Partial<EntityA>): Observable<EntityA> {
  return this.http.post<EntityA>('/api/entity-a', data, {
    context: new HttpContext().set(HANDLE_ERROR_LOCALLY, true)
  });
}
```

**Passo 4 — Use case trata o 422 e relança o resto:**

```ts
// features/feature-x/internal/action-x.use-case.ts
execute(payload: EntityAPayload): Observable<EntityA> {
  return this.repo.create(payload).pipe(
    catchError(error => {
      if (error.status === 422) {
        return throwError(() => error.error.errors);
      }
      return throwError(() => error);  // interceptor global trata
    })
  );
}
```

**Passo 5 — Feature mostra o feedback:**

```ts
// features/feature-x/feature-x.ts
validationErrors = signal<Record<string, string>>({});

async onActionTriggered(): Promise<void> {
  this.validationErrors.set({});
  try {
    await firstValueFrom(this.useCase.execute(this.form()));
  } catch (errors) {
    this.validationErrors.set(errors);
  }
}
```

**Fluxo completo:**

```mermaid
sequenceDiagram
    participant F as Feature
    participant UC as Use Case
    participant API as EntityAApi
    participant I as Interceptor Global

    F->>UC: execute(payload)
    UC->>API: create(payload) + HANDLE_ERROR_LOCALLY
    API->>I: requisição HTTP
    I->>API: 422 — vê HANDLE_ERROR_LOCALLY, deixa passar
    API->>UC: throwError(422)
    UC->>UC: catchError — trata 422
    UC->>F: throwError(validationErrors)
    F->>F: validationErrors.set(errors)
```

**Onde cada peça mora:**

```
shared/utils/http/
├── http-context.ts          # token HANDLE_ERROR_LOCALLY
└── error-interceptor.ts     # interceptor global

features/feature-x/
├── internal/
│   ├── entity-a-api.ts      # passa contexto na chamada
│   └── action-x.use-case.ts # trata 422, relança o resto
└── feature-x.ts             # feedback na tela via signals
```

### 6.5 BFF (Backend for Frontend)

Quando a linguagem do backend não bate com a do frontend, use um BFF — fisicamente no backend, mas logicamente do time frontend.

```mermaid
flowchart LR
    S1["Serviço A"] --> BFF["BFF\ntraduz para a linguagem do frontend"]
    S2["Serviço B"] --> BFF
    S3["Serviço C"] --> BFF
    BFF --> FE["Frontend — Domínio A"]
```

---

## 7. Adapter Pattern para bibliotecas externas

### 7.1 O problema

Bibliotecas de terceiros mudam de API, saem de manutenção ou precisam ser trocadas. Se a lib for usada diretamente em vários módulos, trocá-la exige refatorar todos os pontos de uso. Além disso, a API da lib contamina a semântica do domínio.

```mermaid
flowchart LR
    F1["feature-x"] --> AD["XAdapter\ninterface própria"]
    F2["feature-y"] --> AD
    D1["data-access"] --> AD
    AD -->|"internal/"| L2["lib externa\nencapsulada"]
```

> **MUST:** crie um adapter sempre que uma lib de terceiro afetar mais de um arquivo. O import da lib é proibido fora de `internal/`.

### 7.2 Onde mora o adapter

- Lib usada em múltiplos domínios: `shared/utils/adapters/` ou `shared/utils/<nome>/`.
- Lib usada em um único domínio: `domain-a/utils/<nome>/`.
- A implementação que importa a lib fica em `internal/`. A interface é pública.

```
shared/utils/adapters/
├── analytics-adapter.ts        # interface (pública)
└── internal/
    └── analytics-impl.ts       # implementação (privada) — toca a lib
```

### 7.3 Como implementar

Passo 1 — Defina a interface na sua linguagem, sem vocabulário da lib:

```ts
// shared/utils/adapters/analytics-adapter.ts
export abstract class AnalyticsAdapter {
  abstract trackEvent(name: string, props?: Record<string, unknown>): void;
  abstract identifyUser(userId: string, traits?: Record<string, unknown>): void;
  abstract trackPageView(path: string): void;
}
```

Passo 2 — Implemente em `internal/` usando a lib:

```ts
// shared/utils/adapters/internal/analytics-impl.ts
import thirdPartyLib from 'third-party-lib'; // import CONFINADO aqui
import { AnalyticsAdapter } from '../analytics-adapter';

export class AnalyticsImpl extends AnalyticsAdapter {
  trackEvent(name: string, props?: Record<string, unknown>): void {
    thirdPartyLib.capture(name, props);
  }
  identifyUser(userId: string, traits?: Record<string, unknown>): void {
    thirdPartyLib.identify(userId, traits);
  }
  trackPageView(path: string): void {
    thirdPartyLib.capture('$pageview', { path });
  }
}
```

Passo 3 — Registre no DI e injete sempre a interface, nunca a implementação:

```ts
// app.config.ts
providers: [{ provide: AnalyticsAdapter, useClass: AnalyticsImpl }];

// feature component — nunca importa a lib diretamente
export class FeatureX {
  private analytics = inject(AnalyticsAdapter);

  onItemSelected(item: EntityA): void {
    this.analytics.trackEvent('item_selected', { itemId: item.id });
  }
}
```

### 7.4 Trocando de lib

Quando a lib precisar ser trocada, apenas uma linha muda:

```ts
// app.config.ts — única alteração
{ provide: AnalyticsAdapter, useClass: NewAnalyticsImpl }
```

Nenhum componente, nenhum serviço de domínio e nenhum teste de feature precisam saber.

### 7.5 Categorias comuns de adapter

| Categoria                         | Adapter sugerido       | Localização                  |
| --------------------------------- | ---------------------- | ---------------------------- |
| Analytics (PostHog, Mixpanel, GA) | `AnalyticsAdapter`     | `shared/utils/adapters/`     |
| Toast / Notificação               | `NotificationAdapter`  | `shared/utils/notification/` |
| Data e hora (date-fns, Luxon)     | `DateAdapter`          | `shared/utils/date/`         |
| Geração de PDF                    | `PdfAdapter`           | `shared/utils/pdf/`          |
| Gráficos (Chart.js, ECharts)      | `ChartAdapter`         | `shared/utils/chart/`        |
| Storage (localStorage, IndexedDB) | `StorageAdapter`       | `shared/utils/storage/`      |
| Monitoramento de erros (Sentry)   | `ErrorTrackingAdapter` | `shared/utils/monitoring/`   |

### 7.6 Quando não criar um adapter — MAY

- Uso mínimo de uma linha em um único arquivo.
- Libs do ecossistema Angular (`@angular/forms`, `@angular/router`) — são extensões do framework, não terceiros voláteis.
- Quando o custo de criar o adapter supera o risco de ter que trocar a lib.

> Heurística: se a lib aparece em mais de um módulo ou se trocá-la seria doloroso, crie o adapter.

---

## 8. Roteamento e navegação

### 8.1 Estrutura de rotas por domínio

As rotas raiz delegam segmentos a arquivos `*.routes.ts` de cada domínio via `loadChildren`. O domínio decide suas sub-rotas; o shell delega apenas um segmento.

### 8.2 Guards, resolvers, `canMatch`

Prefira funções (functional guards) — mais simples, tree-shakable e testáveis que classes.

```ts
// shared/utils/auth/auth-guard.ts
export const authGuard: CanMatchFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

- **`canMatch`** (SHOULD sobre `canActivate`): impede até o lazy load se não autorizado.
- **Resolver:** use com parcimônia. Bloqueia a navegação; prefira navegar e mostrar loading via signal.

### 8.3 Estado de navegação e deep linking

Estado que precisa sobreviver a refresh ou ser compartilhável por link mora na URL (query params), não só em memória. Sincronize URL e signal nas features que precisam de deep linking.

---

## 9. Formulários

### 9.1 Reactive Forms tipados — padrão atual — MUST

Use Reactive Forms tipados para formulários com validação ou lógica.

```ts
form = new FormGroup({
  name:  new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
});
```

### 9.2 Validação e componentes de form reutilizáveis

- Funções de validação reutilizáveis: `utils/` do domínio ou `shared/utils/`.
- Componentes de input customizados (`ControlValueAccessor`): `ui/` do domínio ou `shared/ui/`.

### 9.3 Signal Forms (visão futura — MAY)

Experimental no Angular 21, com estabilização prevista para o 22. Pode ser adotado em áreas não-críticas para ganhar experiência. Manter Reactive Forms como padrão até o time validar a migração.

---

## 10. Performance

### 10.1 OnPush + Signals

Padrão obrigatório (Seção 4.3). É a maior alavanca de performance no Angular zoneless: renderização granular, sem checagens globais.

### 10.2 Deferrable views e lazy loading

- `@defer` para conteúdo abaixo da dobra ou pesado.
- Lazy loading por domínio para enxugar o bundle inicial.

### 10.3 Bundle budgets — MUST

Configure budgets no `angular.json`.

```jsonc
"budgets": [
  { "type": "initial",           "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb" }
]
```

---

## 11. Testes

### 11.1 Estratégia (pirâmide)

```mermaid
flowchart TB
    E2E["E2E — poucos\nPlaywright — fluxos críticos"]
    Comp["Componente — vários\nrender + input/output"]
    Unit["Unidade — muitos\nserviços, repositórios, funções puras"]
    E2E --- Comp --- Unit
```

Runner: Vitest (padrão Angular 21+). E2E: Playwright.

### 11.2 Testando com Repository

O principal benefício do Repository é trocar a implementação nos testes sem subir HTTP:

```ts
// data-access/entity-a/entity-a-api.mock.ts
export class EntityAApiMock extends EntityARepository {
  findAll  = vi.fn(() => of([mockEntityA]));
  findById = vi.fn(() => of(mockEntityA));
  create   = vi.fn(() => of(mockEntityA));
  update   = vi.fn(() => of(mockEntityA));
  remove   = vi.fn(() => of(undefined));
}

// features/feature-x/feature-x.spec.ts
TestBed.configureTestingModule({
  providers: [{ provide: EntityARepository, useClass: EntityAApiMock }],
});
```

### 11.3 Unidade

Funções de `utils/`, repositório concreto (com `HttpClientTestingModule`) e stores — testáveis sem renderizar componente.

```ts
describe('EntityAStore.load', () => {
  it('popula items após load', async () => {
    const store = TestBed.inject(EntityAStore);
    await store.load();
    expect(store.items().length).toBeGreaterThan(0);
  });
});
```

### 11.4 Componente

Teste comportamento (dado input, renderiza X; ao clicar, emite Y), não detalhes internos.

```ts
it('emite select ao clicar', async () => {
  await render(Card, { inputs: { title: 'Item X' }, on: { select: onSelect } });
  await userEvent.click(screen.getByRole('button', { name: /selecionar/i }));
  expect(onSelect).toHaveBeenCalled();
});
```

### 11.5 E2E

**MUST:** apenas fluxos críticos de negócio. E2E é caro e frágil; não replique a pirâmide nele. Cobertura é sinal, não meta.

---

## 12. Padrões de estilo e convenções

### 12.1 Formatação e lint

**MUST:** Prettier (formatação) + ESLint + Sheriff (boundaries). Formatação não é pauta de revisão de código.

### 12.2 Nomenclatura de arquivos e classes — MUST

| Tipo                   | Padrão                     | Exemplo                    |
| ---------------------- | -------------------------- | -------------------------- |
| Componente             | `<nome>.ts`                | `feature-x.ts`             |
| Repositório (abstract) | `<entidade>-repository.ts` | `entity-a-repository.ts`   |
| Implementação de API   | `<entidade>-api.ts`        | `entity-a-api.ts`          |
| Store / estado         | `<entidade>-store.ts`      | `entity-a-store.ts`        |
| Use Case               | `<acao>.use-case.ts`       | `action-x.use-case.ts`     |
| Guard                  | `<nome>-guard.ts`          | `auth-guard.ts`            |
| Pipe                   | `<nome>-pipe.ts`           | `currency-pipe.ts`         |
| Adapter                | `<nome>-adapter.ts`        | `analytics-adapter.ts`     |
| Modelo de domínio      | `<entidade>.ts`            | `entity-a.ts`              |
| Rotas                  | `<feature>.routes.ts`      | `feature-x.routes.ts`      |
| Teste                  | `<nome>.spec.ts`           | `entity-a-api.spec.ts`     |
| Bootstrap              | `main.ts`                  | `main.ts` (fixo)           |

Classes e componentes: PascalCase (`FeatureX`, `EntityAApi`). Seletores: prefixo do app em kebab (`app-card`). Observables: sufixo `$` (`items$`). Signals: substantivo sem `$` (`items`). Constantes: `UPPER_SNAKE_CASE`.

> O Angular Style Guide 2025 remove sufixos `.component`/`.service`/`.directive`. Serviços são nomeados pelo papel (`*-api`, `*-store`, `*-adapter`). Se o time preferir manter `.component.ts`, configure `--type-separator=.` no CLI. Decida uma vez e seja consistente.

### 12.3 Nomenclatura de métodos — MUST

O nome de um método deve declarar a intenção, não descrever a implementação. Se for preciso ler o corpo do método para entender o que ele faz, o nome está ruim.

Métodos de repositório e API — espelham o verbo HTTP:

| Operação      | Verbo                     | Exemplo                             |
| ------------- | ------------------------- | ----------------------------------- |
| GET (coleção) | `findAll()` / `list*()`   | `findAll()`, `listByStatus(status)` |
| GET (um item) | `findById()` / `get*()`   | `findById(id)`                      |
| POST          | `create*()`               | `create(data)`                      |
| PUT / PATCH   | `update*()`               | `update(id, data)`                  |
| DELETE        | `remove*()` / `delete*()` | `removeById(id)`                    |

Métodos de store e estado:

| Intenção             | Verbo                   | Exemplo                              |
| -------------------- | ----------------------- | ------------------------------------ |
| Disparar busca async | `load*()`               | `loadAll()`, `loadById(id)`          |
| Ação de negócio      | Nome do evento          | `select(item)`, `approve(id)`        |
| Resetar estado       | `reset*()` / `clear*()` | `resetSelection()`, `clearFilters()` |
| Inicializar          | `initialize()`          | `initialize()`                       |

Propriedades computadas e booleanos:

| Tipo                  | Prefixo     | Exemplo                           |
| --------------------- | ----------- | --------------------------------- |
| Estado atual          | `is*`       | `isLoading`, `isEmpty`, `isValid` |
| Posse                 | `has*`      | `hasError`, `hasItems`            |
| Permissão             | `can*`      | `canEdit`, `canDelete`            |
| Derivado (quantidade) | Substantivo | `count`, `total`                  |

Event handlers em componentes:

```ts
// ✅ Correto: descreve o que aconteceu, não o elemento
onItemSelected(item: EntityA): void { }
onFormSubmitted(): void { }
onFilterChanged(filter: Filter): void { }

// ❌ Errado: genérico demais
click(): void { }
submit(): void { }
change(): void { }
```

### 12.4 Organização e tamanho de arquivos

- Um conceito primário por arquivo. Componente, template e estilos no mesmo diretório.
- Arquivo difícil de ler de uma vez é sinal de SRP violado — quebre.

### 12.5 Comentários e documentação por feature

- **SHOULD:** cada feature ou domínio tem um `README.md` curto (o que faz, decisões principais, pontos de extensão).
- **SHOULD:** comentários explicam por que, não o quê. TSDoc em APIs públicas de módulos.

---

## 13. Enforcement e tooling

### 13.1 Sheriff: tags e depRules

```bash
npm i -D @softarc/sheriff-core @softarc/eslint-plugin-sheriff
```

```ts
// sheriff.config.ts
import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  enableBarrelLess: true,
  modules: {
    'src/app/domains/<domain>': {
      'features/<name>':     ['domain:<domain>', 'type:feature'],
      'ui/<name>':           ['domain:<domain>', 'type:ui'],
      'data-access/<name>':  ['domain:<domain>', 'type:data'],
      'utils/<name>':        ['domain:<domain>', 'type:util'],
    },
  },
  depRules: {
    root: '*',
    'domain:*':     [sameTag, 'domain:shared'],
    'type:feature': ['type:ui', 'type:data', 'type:util'],
    'type:ui':      ['type:data', 'type:util'],
    'type:data':    ['type:util'],
    'type:util':    [],
  },
};
```

### 13.2 Detective: visualização e análise forense

```bash
npm i -D @softarc/detective && npx detective
```

- **Grafo de dependências** — a espessura das arestas indica o volume de imports.
- **Change Coupling** — arquivos que mudam juntos no histórico Git revelam acoplamento lógico não visível no grafo.
- **Hotspots** — alta frequência de mudança cruzada com complexidade indica candidato a refatoração.
- **Team Alignment** — verifica se os times estão alinhados com os domínios (Lei de Conway).

> Essas análises são base de discussão, não metas numéricas. Apontam onde olhar; a decisão é do time.

### 13.3 Gates de CI — MUST

```bash
npm run lint    # ESLint + Sheriff
npm run test    # Vitest
npm run build   # com budgets
```

---

## 14. Apêndices

### 14.1 Checklist — criar um novo domínio

- [ ] O nome é um conceito de negócio, não técnico?
- [ ] As fronteiras foram discutidas com o time?
- [ ] A pasta `src/app/domains/<domain>/` foi criada com as camadas necessárias (`features/`, `ui/`, `data-access/`, `utils/`)?
- [ ] As tags do Sheriff foram configuradas?
- [ ] A rota raiz delega via `loadChildren`?

### 14.2 Checklist — criar uma nova feature

- [ ] Classifiquei a camada e o domínio?
- [ ] A feature injeta `EntityARepository`, não `EntityAApi` diretamente?
- [ ] O Observable está confinado à camada `data-access/`? `toSignal()` na fronteira?
- [ ] Nenhum `.subscribe()` ou `async` pipe no componente?
- [ ] Se a ação orquestra mais de uma chamada — criei um Use Case em `internal/`?
- [ ] O componente é standalone + OnPush?
- [ ] O lazy loading está configurado na rota?
- [ ] Sem `NgModule`, sem barrel (`index.ts`)?
- [ ] O teste co-localizado foi criado?
- [ ] `npm run lint` passa?

### 14.3 Checklist — adotar nova lib externa

- [ ] Criei um adapter em `shared/utils/<nome>/` ou `<domain>/utils/<nome>/`?
- [ ] A implementação que importa a lib está em `internal/`?
- [ ] A interface usa vocabulário do meu domínio, não da lib?
- [ ] O código de feature injeta a interface, não a implementação?
- [ ] O `app.config.ts` registra `{ provide: XAdapter, useClass: XAdapterImpl }`?
- [ ] O teste usa um mock do adapter, não da lib?

### 14.4 Glossário

- **Vertical / Domínio** — fatia de negócio (bounded context).
- **Camada** — separação técnica: `features/`, `ui/`, `data-access/`, `utils/`.
- **Bounded Context** — fronteira dentro da qual um modelo e uma linguagem são consistentes (DDD).
- **Repository** — abstract class que define o contrato de acesso a dados, desacoplando a feature da implementação.
- **Use Case** — classe em `internal/` da feature que orquestra múltiplas chamadas ou side effects, mantendo o componente limpo.
- **Anti-corruption Layer (ACL)** — função de tradução em `internal/` do domínio consumidor que protege sua linguagem de mudanças no domínio emissor.
- **Adapter** — wrapper que encapsula uma lib externa atrás de uma interface própria.
- **Smart / Dumb Component** — container (com lógica, acessa store) vs. apresentacional (só input/output).
- **toSignal()** — ponte que converte um Observable da camada `data-access/` em Signal consumível pelo componente.
- **Change Coupling** — arquivos que mudam juntos no histórico Git, indicando acoplamento lógico.
- **Hotspot** — arquivo com alta frequência de mudança cruzada com complexidade.
- **BFF** — Backend for Frontend; traduz contextos do backend para a linguagem de uma vertical de frontend.

### 14.5 Anti-padrões

- **`shared/` inchado** — a maioria do código vira compartilhado, recriando acoplamento global.
- **`utils/` genérico (`utils.ts`)** — vira lixeira sem coesão; nomeie pelo conteúdo (`date-formatting.ts`).
- **Import entre domínios** — burla os boundaries; use `shared/` ou remodele os domínios.
- **`HttpClient` em `features/`** — vaza acesso a dados para fora da camada `data-access/`.
- **`.subscribe()` no componente** — exige gerenciamento manual de unsubscribe; use `toSignal()`.
- **`async` pipe no template** — mistura paradigmas com signals; use `toSignal()` na fronteira.
- **Abstract class usada como implementação** — o repositório é o contrato; a implementação (`*-api.ts`) é quem herda.
- **Lib externa importada fora de `internal/`** — viola o adapter pattern.
- **Promoção especulativa** — extrair "para reusar" antes de existir um segundo consumidor.
- **`effect` para derivar estado** — use `computed`.
- **Barrels (`index.ts`)** — quebram tree-shaking e lazy loading.
- **Mutação de estado no lugar** — no zoneless, pode não atualizar a tela.
- **Orquestração no componente** — use Use Case quando houver mais de uma chamada ou side effect.
- **ACL ausente** — tradução espalhada pelas features; centralize em `internal/domain-x-acl.ts`.

---

### Referências

- Angular Style Guide (2025) — https://angular.dev/style-guide
- _Enterprise Angular: Architectures with Moduliths and Micro Frontends_, Manfred Steyer (7ª ed.)
- _Modern Angular: Architecture, Concepts, Implementation_, Manfred Steyer — https://angular-book.com
- Sheriff — https://github.com/softarc-consulting/sheriff
- Detective — https://github.com/angular-architects/detective
