import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HistoryService } from './history.service';
import { IRowData } from '../interfaces';
import { EditCellAction } from '../actions/edit-cell.action';
import { RemoveRowAction } from '../actions/remove-row.action';
import { AddRowAction } from '../actions/add-row.action';

@Injectable({
  providedIn: 'root',
})
export class GridService<T = any> {
  private rowDataSubject = new BehaviorSubject<IRowData<T>[]>([]);
  rowData$ = this.rowDataSubject.asObservable();

  constructor(private historyService: HistoryService) {}

  initializeData(data: IRowData<T>[]) {
    this.rowDataSubject.next(data);
  }

  addRow(rowIndex: number) {
    const currentData = this.rowDataSubject.getValue();
    const newRow = this.createEmptyRow();
    currentData.splice(rowIndex, 0, newRow);
    this.rowDataSubject.next([...currentData]);
    this.historyService.addAction(new AddRowAction(this, rowIndex));
  }

  insertRow(rowIndex: number, rowData: IRowData<T>) {
    const currentData = this.rowDataSubject.getValue();
    currentData.splice(rowIndex, 0, rowData);
    this.rowDataSubject.next([...currentData]);
  }

  removeRow(rowIndex: number, skipStory: boolean = false) {
    const currentData = this.rowDataSubject.getValue();
    const removedRow = currentData.splice(rowIndex, 1)[0];
    this.rowDataSubject.next([...currentData]);
    if (!skipStory) {
      this.historyService.addAction(
        new RemoveRowAction(this, rowIndex, removedRow)
      );
    }
  }

  setCellValue(
    rowIndex: number,
    colIndex: keyof IRowData<T>,
    value: T,
    skipHistory: boolean = false
  ) {
    const currentData = this.rowDataSubject.getValue();
    const oldValue = currentData[rowIndex][colIndex];
    currentData[rowIndex][colIndex] = value;
    this.rowDataSubject.next([...currentData]);
    if (!skipHistory) {
      this.historyService.addAction(
        new EditCellAction(this, rowIndex, colIndex, oldValue, value)
      );
    }
  }

  createEmptyRow(): IRowData<T> {
    return {} as IRowData<T>;
  }

  updateData(data: IRowData<T>[]) {
    this.rowDataSubject.next(data);
  }
}
