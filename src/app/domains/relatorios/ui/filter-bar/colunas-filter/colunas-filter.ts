import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { PassagensColumnConfig, PassagensDataColumnId } from '../../../features/passagens/passagens.models';

@Component({
  selector: 'app-colunas-filter',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './colunas-filter.html',
  styleUrl: './colunas-filter.scss',
})
export class ColunasFilter {
  readonly colunas = input.required<PassagensColumnConfig[]>();
  readonly fixedColumnKey = input.required<PassagensDataColumnId>();
  readonly colunaToggle = output<PassagensDataColumnId>();
  private readonly languageStorageKey = 'language';
  private readonly fallbackLanguage = 'pt-BR';

  protected readonly visibleSortedColunas = computed(() => {
    const collator = new Intl.Collator(this.getSelectedLanguage(), { sensitivity: 'base' });
    return [...this.colunas()]
      .filter((coluna) => coluna.key !== this.fixedColumnKey())
      .sort((left, right) => collator.compare(left.label, right.label));
  });

  getColunasSelecionadasLabel(): string {
    const selecionadas = this.visibleSortedColunas()
      .filter((coluna) => coluna.visibility)
      .map((coluna) => coluna.label);

    return selecionadas.join(', ');
  }

  private getSelectedLanguage(): string {
    return sessionStorage.getItem(this.languageStorageKey) ?? this.fallbackLanguage;
  }
}
