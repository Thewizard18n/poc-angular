// src/app/auth/data-access/auth.repository.mock.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { dataRepository } from './data.repository';
import { DataModel } from './data.model';

@Injectable()
export class DataRepositoryMock extends dataRepository {
    getMessage(): Observable<DataModel> {
        return of({ message: 'Mock data' });
    }
}