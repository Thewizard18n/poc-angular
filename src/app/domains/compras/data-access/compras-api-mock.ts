import { Injectable } from '@angular/core';
import { ComprasRepository } from './compras-repository';

@Injectable({ providedIn: 'root' })
export class ComprasApiMock extends ComprasRepository {}
