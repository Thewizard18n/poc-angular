// src/app/auth/feature-login/login.usecase.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { dataRepository } from '../data-access';

/**
 * Use case de login.
 * Orquestra a autenticação e o redirecionamento.
 */
@Injectable()
export class FeatureUseCase {
  private data = inject(dataRepository);

  getMessage() {
    return this.data.getMessage().pipe(
      tap((data) => {
        console.log('Data received:', data);
      }),
    );
  }
}
