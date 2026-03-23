import { TestBed } from '@angular/core/testing';

import { FeatureUseCase } from './feature-use-case';

describe('FeatureUseCase', () => {
  let service: FeatureUseCase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureUseCase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
