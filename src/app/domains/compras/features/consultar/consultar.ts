import { Component, inject } from '@angular/core';
import { ConsultarUsecase } from './consultar-usecase';

@Component({
  selector: 'app-consultar',
  imports: [],
  templateUrl: './consultar.html',
  styleUrl: './consultar.scss',
})
export class Consultar {
  protected readonly usecase = inject(ConsultarUsecase);
}
