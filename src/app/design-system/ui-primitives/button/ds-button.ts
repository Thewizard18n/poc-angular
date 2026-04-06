import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type DsButtonVariant = 'primary' | 'secondary' | 'tonal' | 'text';
export type DsButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ds-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, NgClass],
  templateUrl: './ds-button.html',
  styleUrl: './ds-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsButton {
  readonly variant = input<DsButtonVariant>('primary');
  readonly size = input<DsButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly ariaLabel = input<string | null>(null);

  protected isDisabled(): boolean {
    return this.disabled() || this.loading();
  }
}
