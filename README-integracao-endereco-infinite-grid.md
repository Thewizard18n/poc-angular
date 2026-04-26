# Integracao de Endereco no Infinite Row (Angular + AG Grid)

Este guia documenta exatamente o que foi implementado para:

- carregar linhas com `fetchRows`;
- encadear uma segunda API com `switchMap` para buscar endereco por coordenada;
- mapear o retorno por `index` para dentro do objeto da linha na chave `adress`;
- usar mock com 1000 registros totais e retorno da API de endereco em blocos de 100.

> Observacao: a chave foi mantida como `adress` (sem o segundo "d") para ficar igual ao que foi pedido/implementado.

---

## 1) Modelos (tipagens)

Arquivo de referencia: `passagens.models.ts`

```ts
export interface PassagemPosition {
  createdAt: number;
  vehicleDisplay: string;
  driverName: string;
  positionDatetime: string;
  positionReceivedAt: string;
  speed: string;
  ignition: string;
  blocking: string;
  battery: string;
  memory: string;
  gps: string;
  satellite: string;
  latitudeLongitude: string;
  latitude: string;
  longitude: string;
  location: string;
  adress?: {
    type: string;
    street: string;
    number: string;
    bairro: string;
  };
  temperature1: string;
  temperature2: string;
  temperature3: string;
  odometer: string;
  hourmeter: string;
  digitalTemperature1: string;
  digitalTemperature2: string;
  digitalTemperature3: string;
  digitalUnit1: string;
  digitalUnit2: string;
  digitalUnit3: string;
}

export interface AddressLookupLocationInput {
  id: string;
  index: number;
  latitude: string;
  longitude: string;
}

export interface AddressLookupRequestPayload {
  LocationList: AddressLookupLocationInput[];
}

export interface AddressLookupLocationResult {
  street: string;
  number: string;
  bairro: string;
}

export interface AddressLookupResponse {
  Type: string;
  LocationList: AddressLookupLocationResult[];
}
```

---

## 2) Data Access (API principal + API de endereco mock)

Arquivo de referencia: `passagens-data-access.ts`

### 2.1 API principal de passagens (1000 itens com paginacao)

```ts
private readonly totalCount = 1000;

getPassagens(payload: PassagensRequestPayload): Observable<PassagensResponse> {
  const { offset, limit } = payload.pagination;
  const startIndex = Math.max(0, offset);
  const endIndex = Math.min(startIndex + limit, this.totalCount);

  const positions: PassagemPosition[] = Array.from({ length: endIndex - startIndex }, (_, index) => {
    const rowId = startIndex + index + 1;
    return {
      createdAt: rowId,
      vehicleDisplay: `Veiculo ${rowId}`,
      driverName: `Motorista ${rowId}`,
      positionDatetime: `2026-04-10 08:${String(rowId % 60).padStart(2, '0')}`,
      positionReceivedAt: `2026-04-10 08:${String((rowId + 3) % 60).padStart(2, '0')}`,
      speed: `${40 + (rowId % 70)} km/h`,
      ignition: rowId % 2 === 0 ? 'Ligada' : 'Desligada',
      blocking: rowId % 3 === 0 ? 'Ativo' : 'Inativo',
      battery: `${12 + (rowId % 3)}V`,
      memory: `${50 + (rowId % 50)}%`,
      gps: rowId % 2 === 0 ? 'OK' : 'Sem sinal',
      satellite: `${8 + (rowId % 5)}`,
      latitude: `-23.${1000 + rowId}`,
      longitude: `-46.${2000 + rowId}`,
      latitudeLongitude: `-23.${1000 + rowId}, -46.${2000 + rowId}`,
      location: `Rua ${rowId}, Cidade`,
      temperature1: `${20 + (rowId % 6)} C`,
      temperature2: `${21 + (rowId % 6)} C`,
      temperature3: `${22 + (rowId % 6)} C`,
      odometer: `${10000 + rowId} km`,
      hourmeter: `${500 + rowId} h`,
      digitalTemperature1: `${15 + (rowId % 4)} C`,
      digitalTemperature2: `${16 + (rowId % 4)} C`,
      digitalTemperature3: `${17 + (rowId % 4)} C`,
      digitalUnit1: `${rowId % 2}`,
      digitalUnit2: `${(rowId + 1) % 2}`,
      digitalUnit3: `${(rowId + 2) % 2}`,
    };
  });

  return of({
    totalCount: this.totalCount,
    maxCreatedAt: positions.at(-1)?.createdAt ?? payload.pagination.maxCreatedAt,
    Positions: positions,
  }).pipe(delay(250));
}
```

### 2.2 API mock de endereco (retorna proximos 100)

```ts
getAddressByLocations(payload: AddressLookupRequestPayload): Observable<AddressLookupResponse> {
  const firstBlock = payload.LocationList.slice(0, 100);
  const locationList = firstBlock.map((location, offset) => {
    const baseNumber = Number.parseInt(location.id, 10) || location.index + offset + 1;
    return {
      street: `Rua Mock ${baseNumber}`,
      number: String(100 + (baseNumber % 900)),
      bairro: `Bairro ${1 + (baseNumber % 20)}`,
    };
  });

  return of({
    Type: 'MOCK_REVERSE_GEOCODING',
    LocationList: locationList,
  }).pipe(delay(350));
}
```

---

## 3) Usecase

Arquivo de referencia: `passagens-usecase.ts`

```ts
getPassagens(payload: PassagensRequestPayload): Observable<PassagensResponse> {
  return this.repository.getPassagens(payload);
}

getAddressByLocations(payload: AddressLookupRequestPayload): Observable<AddressLookupResponse> {
  return this.repository.getAddressByLocations(payload);
}
```

---

## 4) Componente pai (passar as funcoes para a tabela)

Arquivos de referencia: `passagens.ts` e `passagens.html`

### 4.1 No TS

```ts
protected fetchRows = (pagination: PaginationPayload): Observable<PassagensResponse> => {
  // ... monta filtro/payload
  return this.usecase.getPassagens(payload);
};

protected fetchAddressByLocations = (
  payload: AddressLookupRequestPayload,
): Observable<AddressLookupResponse> => {
  return this.usecase.getAddressByLocations(payload);
};
```

### 4.2 No HTML

```html
<app-ui-filter-table
  [columns]="colunas()"
  [fetchRows]="fetchRows"
  [fetchAddressByLocations]="fetchAddressByLocations"
  [reloadToken]="gridReloadToken()"
  (emptyResult)="onResultado($event)"
/>
```

---

## 5) UiFilterTable (switchMap + merge por index)

Arquivo de referencia: `ui-filter-table.ts`

### 5.1 Inputs novos

```ts
readonly fetchRows = input.required<(pagination: PaginationPayload) => Observable<PassagensResponse>>();
readonly fetchAddressByLocations = input.required<
  (payload: AddressLookupRequestPayload) => Observable<AddressLookupResponse>
>();
```

### 5.2 Encadeamento no `getRows`

```ts
this.fetchRows()(pagination)
  .pipe(
    switchMap((response) =>
      this.fetchAddressByLocations()(this.toAddressLookupPayload(response.Positions)).pipe(
        map((addressResponse) => this.applyAddressToPositions(response, addressResponse)),
      ),
    ),
    catchError(() => {
      params.failCallback();
      return EMPTY;
    }),
  )
  .subscribe((response) => {
    this.maxCreatedAt = response.maxCreatedAt;
    params.successCallback(response.Positions, response.totalCount);
    // ... restante da logica existente
  });
```

### 5.3 Montagem do payload da segunda API

```ts
private toAddressLookupPayload(positions: PassagemPosition[]): AddressLookupRequestPayload {
  return {
    LocationList: positions.map((position, index) => ({
      id: String(position.createdAt),
      index,
      latitude: position.latitude,
      longitude: position.longitude,
    })),
  };
}
```

### 5.4 Merge do retorno em `adress` pelo `index`

```ts
private applyAddressToPositions(
  response: PassagensResponse,
  addressResponse: AddressLookupResponse,
): PassagensResponse {
  const mappedPositions = response.Positions.map((position, index) => {
    const address = addressResponse.LocationList[index];
    if (!address) return position;

    return {
      ...position,
      adress: {
        type: addressResponse.Type,
        street: address.street,
        number: address.number,
        bairro: address.bairro,
      },
    };
  });

  return { ...response, Positions: mappedPositions };
}
```

---

## 6) Loader de blocos (status atual)

O loader com `mat-spinner` durante carregamento dos proximos blocos **foi removido** e a tabela voltou ao comportamento visual original.

Se quiser reativar depois, voce pode adicionar um estado de loading local no `getRows` e exibir overlay no HTML/CSS da tabela.

---

## 7) Checklist para aplicar em outro projeto

- [ ] Garantir que cada linha tenha `id`, `latitude`, `longitude` (ou campos equivalentes).
- [ ] Criar os tipos de request/response da API de endereco.
- [ ] Expor `getAddressByLocations` no repository/data-access.
- [ ] Expor `getAddressByLocations` no usecase/facade.
- [ ] Passar funcao `fetchAddressByLocations` para o componente de tabela.
- [ ] Encadear `fetchRows -> switchMap(fetchAddressByLocations)`.
- [ ] Mapear retorno para `adress` usando o mesmo `index` da pagina retornada.
- [ ] Validar build/lint.

---

## 8) Dica de nomenclatura (opcional)

Se quiser corrigir padrao de ingles no futuro:

- trocar `adress` por `address`;
- manter compatibilidade temporaria preenchendo ambos por um periodo de transicao.

