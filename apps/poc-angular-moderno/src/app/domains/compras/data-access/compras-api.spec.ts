import { TestBed } from '@angular/core/testing';

import { ComprasApi } from './compras-api';

describe('ComprasApi', () => {
  let service: ComprasApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComprasApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
