import { Injectable } from '@angular/core';
import { EstoqueRepository } from './estoque-repository';

@Injectable({ providedIn: 'root' })
export class EstoqueApi extends EstoqueRepository {}
