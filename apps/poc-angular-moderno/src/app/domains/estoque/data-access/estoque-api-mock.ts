import { Injectable } from '@angular/core';
import { EstoqueRepository } from './estoque-repository';

@Injectable({ providedIn: 'root' })
export class EstoqueApiMock extends EstoqueRepository {}
