# README - Ordenacao de colunas por idioma (sessionStorage)

Este guia mostra como replicar, em outro projeto Angular, a logica de:

- traduzir labels de colunas antes de renderizar;
- ordenar alfabeticamente as colunas conforme o idioma atual;
- usar idioma salvo no `sessionStorage`;
- esconder a coluna fixa de `Data/Hora` no menu de colunas;
- validar rapidamente o comportamento no navegador.

---

## 1) Estrutura de traducoes

Crie os arquivos em `public/i18n/`:

- `pt-BR.json`
- `en-US.json`

Exemplo minimo de chaves usadas nas colunas:

```json
{
  "TRANSLATE-BATTERY": "Battery",
  "TRANSLATE-BLOCKING": "Blocking",
  "TRANSLATE-POSITIONDATETIME": "Date/Time",
  "TRANSLATE-VEHICLEDISPLAY": "Vehicle"
}
```

> Importante: mantenha as mesmas chaves do seu `columns.config.ts`.

---

## 2) Bootstrap do idioma no app

No `app.config.ts`, inicialize o `TranslateService` com:

1. fallback (`pt-BR`);
2. idioma do `sessionStorage` (chave `language`);
3. fallback automatico se o idioma salvo falhar.

Exemplo:

```ts
function initializeTranslations(translate: TranslateService): () => Promise<unknown> {
  return () => {
    const fallbackLanguage = 'pt-BR';
    const selectedLanguage = sessionStorage.getItem('language') ?? fallbackLanguage;

    translate.setDefaultLang(fallbackLanguage);
    return firstValueFrom(
      translate.use(selectedLanguage).pipe(
        catchError(() => translate.use(fallbackLanguage)),
      ),
    );
  };
}
```

---

## 3) Config de colunas com chave de traducao

No arquivo de configuracao de colunas (ex.: `passagens-columns.config.ts`), mantenha `label` como chave de traducao:

```ts
{ key: 'battery', label: 'TRANSLATE-BATTERY', visibility: true }
```

Tambem mantenha uma constante para a coluna fixa:

```ts
export const FIXED_POSITION_DATETIME_COLUMN_KEY = 'positionDatetime';
```

---

## 4) Traduzir + ordenar antes de renderizar

No componente de feature (ex.: `passagens.ts`), ao montar a lista inicial:

1. ler idioma atual (`sessionStorage` -> `translate.currentLang` -> fallback);
2. traduzir labels (`translate.instant`);
3. ordenar por `Intl.Collator(locale)`;
4. manter `positionDatetime` fixa no inicio.

Exemplo:

```ts
private buildInitialColumns(): PassagensColumnConfig[] {
  const locale = this.getSelectedLanguage();
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const baseColumns = [...PASSAGENS_COLUMNS_CONFIG].map((column) => ({
    ...column,
    label: this.translate.instant(column.label),
  }));

  const fixedColumn = baseColumns.find((column) => column.key === this.fixedColumnKey);
  const sortableColumns = baseColumns
    .filter((column) => column.key !== this.fixedColumnKey)
    .sort((left, right) => collator.compare(left.label, right.label));

  return fixedColumn ? [fixedColumn, ...sortableColumns] : sortableColumns;
}

private getSelectedLanguage(): string {
  return sessionStorage.getItem('language') ?? this.translate.currentLang ?? 'pt-BR';
}
```

---

## 5) Menu de colunas: ordem alfabetica por idioma e sem Data/Hora

No componente de filtro de colunas (ex.: `colunas-filter.ts`):

1. criar lista computada ordenada alfabeticamente;
2. remover a coluna fixa (`fixedColumnKey`) da lista exibida.

Exemplo:

```ts
protected readonly visibleSortedColunas = computed(() => {
  const collator = new Intl.Collator(this.getSelectedLanguage(), { sensitivity: 'base' });
  return [...this.colunas()]
    .filter((coluna) => coluna.key !== this.fixedColumnKey())
    .sort((left, right) => collator.compare(left.label, right.label));
});
```

No template (`colunas-filter.html`), renderize essa lista:

```html
@for (coluna of visibleSortedColunas(); track coluna.key) {
  <mat-checkbox [checked]="coluna.visibility" (change)="colunaToggle.emit(coluna.key)">
    {{ coluna.label }}
  </mat-checkbox>
}
```

> Se as labels ja chegam traduzidas, nao use `| translate` novamente no template.

---

## 6) Grid/tabela

Se a coluna ja vem traduzida no objeto de configuracao, use direto no header:

```ts
headerName: config.label
```

Sem novo `translate.instant` nesse ponto.

---

## 7) Como testar rapido no navegador

No DevTools Console:

1. Ingles:
   - `sessionStorage.setItem('language', 'en-US')`
   - `location.reload()`
2. Portugues:
   - `sessionStorage.setItem('language', 'pt-BR')`
   - `location.reload()`

Checklist de validacao:

- labels aparecem no idioma escolhido;
- menu de colunas esta em ordem alfabetica no idioma atual;
- `Data/Hora` nao aparece no menu de colunas;
- tabela continua renderizando colunas corretamente.

---

## 8) Dica de manutencao

Para evitar strings duplicadas no codigo, crie uma constante compartilhada para a chave do storage:

```ts
export const LANGUAGE_STORAGE_KEY = 'language';
```

E reutilize essa constante no `app.config.ts`, feature e componentes de filtro.
