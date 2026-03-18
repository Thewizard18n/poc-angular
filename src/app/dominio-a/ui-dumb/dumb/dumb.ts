// src/app/auth/ui-login-form/login-form.component.ts
import {
  Component,
  output,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { DsButton } from '../../../shared/ui';

/**
 * componente de card para renderizar texto de smart component.
 * Não tem lógica de negócio — só recebe eventos e emite dados.
 * @example
 * <app-dumb (submitForm)="onSubmit($event)" />
 */
@Component({
  selector: 'app-dumb',
  standalone: true,
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div>
    {{ message()}}
    <app-ds-button [disabled]="loading()" (click)="onSubmit()">
      {{ loading() ? 'Entrando...' : 'Entrar' }}
    </app-ds-button>
  </div>
  `,
})
export class dumb {
  loading = signal(false);
  message = signal('');

  /** Emite as credenciais quando o form é submetido */
  sendMessage = output<{ message: string }>();

  onSubmit() {
    this.sendMessage.emit({
      message: this.message(),
    });
  }
}