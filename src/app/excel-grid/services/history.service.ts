import { Injectable } from '@angular/core';
import { Action } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];

  execute(action: Action) {
    // action.redo();
    this.undoStack.push(action);
    // this.redoStack = []; // Limpa a pilha de refazer quando uma nova ação é executada
  }

  undo() {
    const action = this.undoStack.pop();
    if (action) {
      action.undo();
      this.redoStack.push(action);
    }
  }

  redo() {
    const action = this.redoStack.pop();
    if (action) {
      action.redo();
      this.undoStack.push(action);
    }
  }
}
