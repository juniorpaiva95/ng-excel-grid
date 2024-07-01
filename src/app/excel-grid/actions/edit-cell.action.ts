import { Action, IRowData } from '../interfaces';
import { GridService } from '../services/grid.service';

export class EditCellAction<T> implements Action {
  constructor(
    private gridService: GridService<T>,
    private rowIndex: number,
    private colIndex: keyof IRowData<T>,
    private oldValue: T,
    private newValue: T
  ) {}

  undo() {
    this.gridService.setCellValue(this.rowIndex, this.colIndex, this.oldValue, true);
  }

  redo() {
    this.gridService.setCellValue(this.rowIndex, this.colIndex, this.newValue, true);
  }
}
