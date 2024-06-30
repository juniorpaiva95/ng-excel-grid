import { Action, IRowData } from '../interfaces';
import { GridService } from '../services/grid.service';

export class RemoveRowAction<T> implements Action {
  constructor(
    private gridService: GridService<T>,
    private rowIndex: number,
    private removedRow: IRowData<T>
  ) {}

  undo() {
    this.gridService.insertRow(this.rowIndex, this.removedRow);
  }

  redo() {
    this.gridService.removeRow(this.rowIndex);
  }
}
