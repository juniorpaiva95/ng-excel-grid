import { Action } from '../interfaces';
import { GridService } from '../services/grid.service';

export class AddRowAction<T> implements Action {
  constructor(private gridService: GridService<T>, private rowIndex: number) {}

  undo() {
    this.gridService.removeRow(this.rowIndex);
  }

  redo() {
    this.gridService.addRow(this.rowIndex);
  }
}
