import { Component, inject } from '@angular/core';
import { AprovarUsecase } from './aprovar-usecase';

@Component({
  selector: 'app-aprovar',
  imports: [],
  templateUrl: './aprovar.html',
  styleUrl: './aprovar.scss',
})
export class Aprovar {
  protected readonly usecase = inject(AprovarUsecase);
}
