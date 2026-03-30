import { TestBed } from '@angular/core/testing';

import { EstoqueApi } from './estoque-api';

describe('EstoqueApi', () => {
  let service: EstoqueApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstoqueApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
