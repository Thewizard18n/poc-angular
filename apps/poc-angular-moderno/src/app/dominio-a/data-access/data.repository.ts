// src/app/auth/data-access/auth.repository.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataModel } from './data.model';

@Injectable()
export abstract class dataRepository {
  abstract getMessage(): Observable<DataModel>;
}
