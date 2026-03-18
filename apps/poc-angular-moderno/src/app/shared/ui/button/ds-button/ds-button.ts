import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ds-button',
  imports: [MatButtonModule],
  template: `
    <button
      mat-raised-button
      [disabled]="disabled()"
      [style.background-color]="'var(--color-primary)'"
      [style.color]="'white'"
      [style.border-radius]="'var(--border-radius-md)'"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      button {
        font-family: var(--font-family-base);
        padding: var(--spacing-sm) var(--spacing-md);
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsButton {
  disabled = input<boolean>(false);
}
