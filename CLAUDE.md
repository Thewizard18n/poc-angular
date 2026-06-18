You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

Detailed architecture reference: [frontend-guidelines.md](docs/frontend-guidelines.md)

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- NEVER mutate state in place — always replace the value (`update(list => [...list, item])`)

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- `track` is required in every `@for`
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
- **NEVER use the `async` pipe or `.subscribe()` in components** — use `toSignal()` at the data-access boundary

## Services

- Design services around a single responsibility
- Shared/singleton services: `providedIn: 'root'`
- Feature-scoped services (stores, use cases): provide at route level, NOT `root`
  ```ts
  { path: 'domain-a', providers: [EntityAStore, { provide: EntityARepository, useClass: EntityAApi }] }
  ```
- Use the `inject()` function instead of constructor injection

## Forms

- Default: **Reactive Forms with typed, nonNullable controls**
  ```ts
  new FormControl('', { nonNullable: true, validators: [Validators.required] });
  ```
- Signal Forms: MAY be adopted for new forms in Angular v21+ projects (experimental — keep Reactive Forms as the baseline until the team validates the migration)
- Reusable validation functions → `utils/` of the domain or `shared/utils/`
- Custom input components → `ui/` of the domain or `shared/ui/`

## Folder Structure (MUST)

```
src/app/domains/
  <domain>/
    features/<feature-name>/
      internal/          ← APIs, repositories, mocks, mappers, use cases
      <feature>.ts
      <feature>.html
      <feature>.routes.ts
      <feature>.spec.ts
    ui/<component-name>/
    data-access/<entity>/
      internal/          ← http-mapper, validators
      <entity>.ts
      <entity>-repository.ts
      <entity>-api.ts
    utils/<topic>/
  shared/
    ui/                  ← design system components
    utils/               ← auth, http, adapters, date, etc.
```

- Domain names must be **business concepts**, never technical (`components`, `services` are forbidden as domain names)
- **No `index.ts` (barrels)** — barrels break tree-shaking and lazy loading
- Sheriff enforces boundaries at lint time; violations block CI

## Information Hiding — `internal/` (MUST)

Place in `internal/` everything that is a _how_ (implementation detail):

- API classes, repository implementations, mocks
- Mappers, validators, use cases, ACL translators

Place at the root level everything that is a _what_ (public contract):

- Abstract repository class, domain models, smart components, route files

No other module may import from another module's `internal/`.

## Dependency Boundaries (MUST)

**Between domains**: a domain may only import from itself and `shared/`. Direct imports between domains are forbidden.

**Between layers** (top → bottom only):

- `features/` → `ui/`, `data-access/`, `utils/`
- `ui/` → `data-access/`, `utils/`
- `data-access/` → `utils/`
- `utils/` → nothing

Communication between domains: via events or contracts in `shared/`, never direct imports.

## Repository Pattern (MUST)

- The `data-access/` layer exposes an `abstract class` as the contract
- Features inject the abstract repository, **never the concrete implementation**
- Provide the implementation via DI at the route level
- In tests, provide a mock that extends the abstract class

```ts
// contract (public)
export abstract class EntityARepository {
  abstract findAll(): Observable<EntityA[]>;
  abstract findById(id: string): Observable<EntityA>;
  abstract create(data: Partial<EntityA>): Observable<EntityA>;
  abstract update(id: string, data: Partial<EntityA>): Observable<EntityA>;
  abstract remove(id: string): Observable<void>;
}

// test mock
export class EntityAApiMock extends EntityARepository {
  findAll = vi.fn(() => of([mockEntityA]));
  findById = vi.fn(() => of(mockEntityA));
  create = vi.fn(() => of(mockEntityA));
  update = vi.fn(() => of(mockEntityA));
  remove = vi.fn(() => of(undefined));
}
```

## Observable → Signal Boundary (MUST)

- Observables live **only** in `data-access/`
- `toSignal()` is the **only** allowed conversion — called once, at the component or store boundary
- FORBIDDEN in components: `.subscribe()`, `async` pipe, raw Observable
- `toSignal()` must be called inside an injection context (class field or constructor, never inside a method)
- Always add `catchError` upstream when the Observable can error — without it, the signal throws in the template

```ts
// ✅ correct
items = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    switchMap((q) => this.repo.findAll()),
  ),
  { initialValue: [] },
);

// ❌ forbidden
this.repo.findAll().subscribe((items) => this.items.set(items));
```

## Use Cases (MUST/SHOULD)

| Situation                       | Solution                                                   |
| ------------------------------- | ---------------------------------------------------------- |
| Single call, void return        | `async` + `firstValueFrom` directly in the component — MAY |
| Two or more chained calls       | Use Case — SHOULD                                          |
| Business rule inside the action | Use Case — MUST                                            |
| Side effects alongside calls    | Use Case — SHOULD                                          |

Use Cases live in `features/<feature>/internal/<action>.use-case.ts` and are `@Injectable()` classes provided at the route level.

## Adapter Pattern (MUST)

Create an adapter whenever a third-party library is used in more than one file:

- Define a public `abstract class` with domain vocabulary (not the lib's API)
- Implement it in `internal/`, where the only `import` of the lib lives
- Features inject the abstract class, never the lib directly
- Register in DI: `{ provide: XAdapter, useClass: XAdapterImpl }`

```ts
// public contract
export abstract class AnalyticsAdapter {
  abstract trackEvent(name: string, props?: Record<string, unknown>): void;
}

// internal implementation — only file that imports the lib
import thirdPartyLib from 'third-party-lib';
export class AnalyticsImpl extends AnalyticsAdapter {
  trackEvent(name, props) {
    thirdPartyLib.capture(name, props);
  }
}
```

Exceptions (adapters NOT required): single-line usage in a single file; Angular ecosystem packages (`@angular/forms`, `@angular/router`).

## Naming Conventions (MUST)

| Type                | Pattern                  | Example                  |
| ------------------- | ------------------------ | ------------------------ |
| Component           | `<name>.ts`              | `feature-x.ts`           |
| Abstract repository | `<entity>-repository.ts` | `entity-a-repository.ts` |
| API implementation  | `<entity>-api.ts`        | `entity-a-api.ts`        |
| Store               | `<entity>-store.ts`      | `entity-a-store.ts`      |
| Use Case            | `<action>.use-case.ts`   | `action-x.use-case.ts`   |
| Adapter             | `<name>-adapter.ts`      | `analytics-adapter.ts`   |
| Domain model        | `<entity>.ts`            | `entity-a.ts`            |
| Routes              | `<feature>.routes.ts`    | `feature-x.routes.ts`    |
| Test                | `<name>.spec.ts`         | `entity-a-api.spec.ts`   |

**Method naming:**

- Repository/API: `findAll`, `findById`, `create`, `update`, `remove`
- Store actions: `load*`, `reset*`, `clear*`, `initialize`
- Boolean computed: `is*` (`isLoading`, `isEmpty`), `has*` (`hasError`), `can*` (`canEdit`)
- Event handlers: `on<Event>` — `onItemSelected`, `onFormSubmitted`, `onFilterChanged`
- Observables: suffix `$`; Signals: noun without suffix

Classes: PascalCase. Selectors: `app-` prefix in kebab-case. Constants: `UPPER_SNAKE_CASE`.

## Testing (MUST)

- Unit/component runner: **Vitest**
- Repository mock: extend the abstract class + `vi.fn()`
- Provide mock via `{ provide: EntityARepository, useClass: EntityAApiMock }`
- Test behavior (given input → renders X; on click → emits Y), not internal implementation details
