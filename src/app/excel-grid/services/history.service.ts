import { Injectable } from '@angular/core';
import { Action } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];

  addAction(action: Action) {
    this.undoStack.push(action);
    this.redoStack = [];
  }

  /**
   * @description Desfazer (Ctrl + Z)
   * @memberof HistoryService
   */
  undo() {
    const action = this.undoStack.pop();
    if (action) {
      action.undo();
      this.redoStack.push(action);
    }
  }

  /**
   * @description Refazer (Ctrl + Y)
   * @memberof HistoryService
   */
  redo() {
    const action = this.redoStack.pop();
    if (action) {
      action.redo();
      this.undoStack.push(action);
    }
  }
}
