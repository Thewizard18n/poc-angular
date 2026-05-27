# Shell — Como funciona

O Shell é a aplicação Angular 21+ que fica sempre carregada no browser. Ele não tem funcionalidade de negócio — ele é a estrutura que sustenta tudo. É ele que decide o que carregar, quando carregar e onde renderizar cada Micro Frontend.

O Shell e todos os MFEs novos são escritos em **Angular moderno** — standalone components, Signals como reatividade primária, zoneless por padrão.

---

## Visão geral

```mermaid
flowchart TB
    S3["S3\nconfig.json + ETag"]

    subgraph Shell["Shell — Angular 21+ (sempre carregado)"]
        CORE["@mcf-shell/core\nMfeLoader + MfeService"]
        BUS["@mcf-shell/event-bus\nPersistent + Transient events"]

        subgraph EP["Extension Points"]
            SB["Sidebar"]
            TB["Toolbar"]
            MC["Main Content"]
        end

        CORE --> EP
        BUS --> EP
    end

    subgraph Novos["MFEs novos — Angular moderno"]
        MFE1["MFE 1\nschematics + skills"]
        MFE2["MFE 2\nschematics + skills"]
    end

    subgraph Legado["MFEs legados — iframe + postMessage"]
        IFR["iframe bridge"]
        LEG1["MFE Legado 1"]
        LEG2["MFE Legado 2"]
        IFR --> LEG1
        IFR --> LEG2
    end

    CDN["CDN\nbundles JS + ETags"]

    S3 -->|"lê config na inicialização"| CORE
    CDN -->|"carrega bundle sob demanda"| CORE
    CORE -->|"Custom Events"| Novos
    CORE -->|"postMessage"| Legado
```

O Shell não sabe com antecedência quais MFEs existem. Ele lê a configuração no S3, monta a estrutura de rotas dinamicamente e carrega cada bundle só quando o usuário navega para aquela área.

---

## Por que o Shell é Angular moderno?

O Shell é a base de tudo — é onde vivem as libs compartilhadas, o event bus e os extension points. Usar Angular 21+ aqui não é só uma escolha técnica: é o que garante que os padrões novos funcionem corretamente.

- Signals e zoneless só entregam o resultado esperado com Angular 21+
- Os schematics e skills que os MFEs vão usar dependem da estrutura do Shell estar no padrão novo
- MFEs legados continuam funcionando via iframe — não há obrigação de reescrita imediata

---

## Schematics e Skills dentro de cada MFE

Cada MFE novo vem com dois recursos que aceleram o desenvolvimento e garantem consistência.

```mermaid
flowchart TB
    subgraph MFE["MFE 1 — Angular moderno"]
        SCH["Schematics\nscaffolding de código"]
        SKL["Skills\ndesenvolvimento agêntico"]
        COD["Código do domínio"]
        SCH -->|"gera estrutura inicial"| COD
        SKL -->|"guia agentes de IA"| COD
    end
```

**Schematics** são geradores de código via Angular CLI. Ao criar um novo domínio, feature ou repositório dentro do MFE, o dev roda um comando e a estrutura correta já é gerada — pastas, arquivos, imports e padrões no lugar certo. Não há decisão manual sobre onde cada coisa mora.

**Skills** são instruções estruturadas para agentes de IA — como o Claude — entenderem os padrões do projeto e gerarem código aderente a eles. Em vez de o agente inventar uma estrutura, ele lê a skill do MFE e sabe exatamente como o código deve ser escrito naquele contexto.

```mermaid
flowchart LR
    DEV["Dev"]
    AG["Agente de IA"]
    SCH["Schematics\nng generate domain"]
    SKL["Skills\nCLAUDE.md + contexto"]
    COD["Código gerado\nadherente aos padrões"]

    DEV -->|"roda CLI"| SCH
    AG -->|"lê antes de gerar"| SKL
    SCH --> COD
    SKL --> COD
```

O resultado é que tanto um dev rodando um comando quanto um agente gerando código chegam no mesmo lugar — a estrutura correta do projeto.

---

## Por que o carregamento é dinâmico?

Em um sistema com múltiplos times entregando MFEs independentes, não é possível — nem desejável — que o Shell precise ser redeployado toda vez que um MFE muda. O carregamento dinâmico resolve isso.

```mermaid
sequenceDiagram
    participant B as Browser
    participant SH as Shell
    participant S3 as S3 (config.json)
    participant CDN as CDN (bundles)

    B->>SH: abre o sistema
    SH->>S3: GET config.json
    S3-->>SH: lista de MFEs + URLs dos bundles
    SH->>SH: monta estrutura de rotas dinamicamente
    B->>SH: navega para uma rota
    SH->>CDN: carrega bundle do MFE correspondente (primeira vez)
    CDN-->>SH: bundle JS
    SH->>SH: instancia o MFE e monta no Main Content
```

**O que isso garante na prática:**

- Um time faz deploy do MFE 1 sem avisar ninguém
- Na próxima navegação para aquela rota, o Shell já carrega a versão nova
- O Shell não foi tocado, não foi redeployado, não foi testado novamente

---

## Por que duas libs separadas — `@mcf-shell/core` e `@mcf-shell/event-bus`?

São responsabilidades diferentes com motivos de mudança diferentes.

| Lib                    | Responsabilidade                                         | Muda quando                                               |
| ---------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `@mcf-shell/core`      | Carregar MFEs, gerenciar extension points, bootstrapping | A mecânica de carregamento ou os pontos de extensão mudam |
| `@mcf-shell/event-bus` | Comunicação entre MFEs via eventos                       | O contrato de comunicação entre MFEs muda                 |

Se fossem uma lib só, uma mudança no carregamento de bundle forçaria todos os MFEs a atualizar a dependência — mesmo os que nunca usam aquela parte. Separadas, cada MFE declara só o que realmente precisa.

```mermaid
flowchart LR
    subgraph MFE1["MFE 1"]
        A["só usa event-bus"]
    end

    subgraph MFE2["MFE 2"]
        B["usa core + event-bus"]
    end

    CORE["@mcf-shell/core"]
    BUS["@mcf-shell/event-bus"]

    A -->|"depende"| BUS
    B -->|"depende"| CORE
    B -->|"depende"| BUS
```

---

## Extension Points — Sidebar, Toolbar e Main Content

O Shell expõe três pontos fixos onde os MFEs podem se registrar. Eles não são páginas — são slots. Cada MFE decide o que colocar em cada slot ao ser carregado.

```mermaid
flowchart TB
    subgraph Shell
        SB["Sidebar"]
        TB["Toolbar"]
        MC["Main Content"]
    end

    subgraph MFE1["MFE 1"]
        R1["registra item no Sidebar"]
        R2["registra ação no Toolbar"]
        R3["renderiza tela no Main Content"]
    end

    R1 -->|"via platform API"| SB
    R2 -->|"via platform API"| TB
    R3 -->|"via platform API"| MC
```

O Shell não conhece o MFE 1 em tempo de compilação. O MFE, ao ser carregado, usa a platform API do `@mcf-shell/core` para se registrar nos slots que precisa.

---

## Event Bus — como os MFEs se comunicam sem se conhecer

MFEs não importam código um do outro. Qualquer comunicação entre eles passa pelo event bus. Existem dois tipos de evento com comportamentos diferentes.

```mermaid
flowchart LR
    subgraph BUS["@mcf-shell/event-bus"]
        PE["Persistent events\n(sobrevivem à navegação)"]
        TE["Transient events\n(pontuais, disparo único)"]
    end

    MFE_A["MFE 1\n(emite)"]
    MFE_B["MFE 2\n(escuta)"]
    MFE_C["MFE 3\n(escuta)"]

    MFE_A -->|"evento.x"| PE
    PE -->|"entrega para quem está escutando"| MFE_B
    PE -->|"entrega para quem está escutando"| MFE_C
```

**Persistent events** — usados para estado que precisa sobreviver à navegação. Se o MFE 1 emitir um evento e o MFE 2 ainda não estiver carregado, o evento fica guardado e é entregue quando o MFE 2 for carregado.

**Transient events** — usados para ações pontuais. O evento existe só no momento do disparo. Se ninguém estiver escutando, ele é descartado.

```mermaid
sequenceDiagram
    participant A as MFE 1
    participant BUS as Event Bus
    participant B as MFE 2
    participant C as MFE 3

    A->>BUS: emite evento.x (persistent)
    BUS-->>B: entrega imediatamente (está carregado)
    Note over C: ainda não foi carregado
    C->>BUS: se inscreve ao ser carregado
    BUS-->>C: entrega o evento que ficou guardado
```

---

## Comunicação com MFEs legados — iframe e postMessage

MFEs legados não conseguem usar o event bus diretamente. A solução é o iframe com uma bridge de postMessage. O Shell faz a tradução.

```mermaid
flowchart TB
    subgraph Shell
        BUS["@mcf-shell/event-bus"]
        BRIDGE["iframe bridge\n(@mcf-shell/core)"]
        BUS <-->|"traduz eventos"| BRIDGE
    end

    subgraph IFrame["iframe (isolado)"]
        LEG["MFE Legado 1"]
        MLEG["manifest.json"]
    end

    BRIDGE <-->|"postMessage"| LEG
    MLEG -->|"descreve o MFE"| BRIDGE
```

**O que o MFE legado consegue fazer via postMessage:**

- Emitir eventos para o event bus do Shell
- Receber eventos do event bus do Shell
- Solicitar navegação para outra rota
- Registrar itens no Sidebar e Toolbar

O MFE legado não sabe que está dentro de um iframe ou que existe um Shell. Ele se comunica com a bridge como se fosse qualquer outra mensagem. A bridge traduz para o event bus.

```mermaid
sequenceDiagram
    participant LEG as MFE Legado 1
    participant BR as iframe bridge
    participant BUS as Event Bus
    participant MFE as MFE 1 (Angular moderno)

    LEG->>BR: postMessage — evento.y
    BR->>BUS: emite evento.y (persistent)
    BUS-->>MFE: entrega evento.y
```

---

## Cache inteligente com ETag

O Shell usa ETag tanto para o `config.json` quanto para os bundles dos MFEs. Isso garante que o browser só baixa o que realmente mudou.

```mermaid
sequenceDiagram
    participant B as Browser
    participant SH as Shell
    participant S3 as S3 (config.json)
    participant CDN as CDN (bundles)

    B->>SH: abre o sistema (segunda vez)
    SH->>S3: GET config.json + If-None-Match: "etag-anterior"
    S3-->>SH: 304 Not Modified (nada mudou)
    SH->>SH: usa config em cache

    B->>SH: navega para uma rota
    SH->>CDN: GET bundle.js + If-None-Match: "etag-bundle-anterior"
    CDN-->>SH: 200 OK + novo bundle (MFE foi atualizado)
    SH->>SH: carrega versão nova
```

O usuário abre o sistema pela segunda vez e quase nada é baixado da rede. Só os bundles que foram atualizados desde a última visita são transferidos.

---

## Fluxo completo — do S3 ao MFE renderizado

```mermaid
sequenceDiagram
    participant B as Browser
    participant SH as Shell
    participant S3 as S3
    participant CDN as CDN
    participant MFE as MFE 1

    B->>SH: abre o sistema
    SH->>S3: GET config.json
    S3-->>SH: lista de MFEs + manifest URLs
    SH->>SH: monta rotas dinamicamente

    B->>SH: navega para uma rota
    SH->>CDN: GET bundle MFE 1
    CDN-->>SH: bundle JS
    SH->>MFE: instancia + chama bootstrap
    MFE->>SH: registra Sidebar, Toolbar, Main Content
    SH->>B: renderiza
```

---

## O que o Shell nunca faz

- Não tem regra de negócio
- Não conhece os MFEs em tempo de compilação
- Não é redeployado quando um MFE muda
- Não comunica MFEs entre si diretamente — essa responsabilidade é do event bus
