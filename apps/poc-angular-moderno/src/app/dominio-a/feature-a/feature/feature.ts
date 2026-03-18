// src/app/auth/feature-login/login.component.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { dumb } from '../../ui-dumb';
import { FeatureUseCase } from '../feature-use-case';
import { dataRepository, DataRepositoryMock } from '../../data-access';

/**
 * Página de login.
 * Compõe o formulário e delega a lógica para o use case.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [dumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FeatureUseCase, { provide: dataRepository, useClass: DataRepositoryMock }],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1 class="login-title">Bem-vindo</h1>
        <app-dumb (sendMessage)="onSubmit($event)"></app-dumb>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-background);
      }
      .login-card {
        background: var(--color-surface);
        padding: var(--spacing-xl);
        border-radius: var(--border-radius-lg);
        border: 1px solid var(--color-border);
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      .login-title {
        font-family: var(--font-family-base);
        font-size: 24px;
        color: var(--color-primary);
      }
      .erro {
        color: red;
        font-size: var(--font-size-sm);
      }
    `,
  ],
})
export class Feature {
  private useCase = inject(FeatureUseCase);

  onSubmit(message: { message: string }) {
    this.useCase.getMessage().subscribe();
  }
}
