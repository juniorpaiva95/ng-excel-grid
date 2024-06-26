import {
  CdkDragDrop,
  CdkDragEnd,
  CdkDragStart,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TooltipDirective } from './tooltip.directive';
import { IColumnDef, IRowData } from './interfaces';
import { ArrowKeys } from './types/arrow-keys.type';
import { Observable } from 'rxjs';
import { GridService } from './services/grid.service';
import { HistoryService } from './services/history.service';

@Component({
  selector: 'app-excel-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TooltipDirective],
  templateUrl: './excel-grid.component.html',
  styleUrls: ['./excel-grid.component.scss'],
})
export class ExcelGridComponent<T = any> implements AfterViewInit, OnInit {
  @Input() columnDefs: IColumnDef[] = [];
  @Input() rowData: IRowData<T>[] = [];

  sortColumn: string = '';
  sortAsc: boolean = true;
  selecting = false;
  selectedCells: { rowIndex: number; colIndex: number }[] = [];
  startCell: { rowIndex: number; colIndex: number } | null = null;
  selectedRowIndex: number | null = null;
  selectedColIndex: number | null = null;
  dragging: boolean = false;
  editingCell: { rowIndex: number; colIndex: number } | null = null;
  editedValue: T = null!;

  // Filter states
  rowData$: Observable<IRowData<T>[]>;
  filteredData = [...this.rowData];
  filterVisible = false;
  filterField = '';
  filterType = 'contains';
  searchText = '';
  allSelected = true;
  options: T[] = [];
  filteredOptions: T[] = [];
  selectedOptions: T[] = [];

  // Context Menu
  contextMenuVisible = false;
  contextMenuPosition = { x: '0px', y: '0px' };
  contextRowMenuPosition = { x: '0px', y: '0px' };
  rowContextMenuVisible = false;

  @ViewChild('excelTable') table!: ElementRef;

  @ViewChild('inputElem') inputElem!: ElementRef;

  @ViewChildren('cell') cells!: QueryList<ElementRef>;

  constructor(
    private gridService: GridService<T>,
    private historyService: HistoryService
  ) {
    this.rowData$ = this.gridService.rowData$;
  }

  ngAfterViewChecked() {
    if (this.inputElem && this.editingCell) {
      this.inputElem.nativeElement.focus();
      // this.setInputHeight();
    }
  }

  ngOnInit(): void {
    this.gridService.initializeData(this.rowData);
    this.rowData$.subscribe((data) => {
      this.filteredData = data;
    });
    this.filteredData = [...this.rowData];
  }

  ngAfterViewInit() {
    this.adjustColumnWidths();
  }

  setInputHeight(rowIndex: number): Promise<void> {
    return new Promise((resolve) => {
      const row: HTMLTableRowElement | null = document.querySelector(
        `tr[row-index="${rowIndex}"]`
      );
      let maxHeight = 0;

      if (row) {
        // Identificar a altura máxima da célula
        Array.from(row.cells).forEach((cell) => {
          const cellElement = cell as HTMLElement;
          const styles = window.getComputedStyle(cellElement);
          const cellHeight =
            cellElement.scrollHeight -
            parseFloat(styles.paddingTop) -
            parseFloat(styles.paddingBottom) -
            parseFloat(styles.borderTopWidth) -
            parseFloat(styles.borderBottomWidth);
          if (cellHeight > maxHeight) {
            maxHeight = cellHeight;
          }
        });

        // Definir todas as células para a altura máxima encontrada
        Array.from(row.cells).forEach((cell) => {
          const cellElement = cell as HTMLElement;
          cellElement.style.height = `${maxHeight}px`;
        });

        if (this.inputElem && maxHeight > 0) {
          this.inputElem.nativeElement.style.height = `${maxHeight}px`;
        }
      }
      resolve();
    });
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.rowData.sort((a, b) => {
      if (a[column] < b[column]) return this.sortAsc ? -1 : 1;
      if (a[column] > b[column]) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  /**
   * Inicia o processo de seleção
   * @param {number} rowIndex
   * @param {number} colIndex
   * @memberof ExcelGridComponent
   */
  startSelection(rowIndex: number, colIndex: number): void {
    this.selecting = true;
    this.startCell = { rowIndex, colIndex };
    this.selectedCells = [{ rowIndex, colIndex }];
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.classList.add('grabbing');
    }
  }

  /**
   * Finaliza a seleção
   * @memberof ExcelGridComponent
   */
  endSelection(): void {
    this.selecting = false;
    this.startCell = null;
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.classList.remove('grabbing');
    }
  }

  /**
   * Atualiza a lista de células selecionadas conforme o mouse se move
   * @param {number} rowIndex
   * @param {number} colIndex
   * @memberof ExcelGridComponent
   */
  trackSelection(rowIndex: number, colIndex: number): void {
    if (this.selecting && this.startCell) {
      this.selectedCells = [];
      const startRow = Math.min(this.startCell.rowIndex, rowIndex);
      const endRow = Math.max(this.startCell.rowIndex, rowIndex);
      const startCol = Math.min(this.startCell.colIndex, colIndex);
      const endCol = Math.max(this.startCell.colIndex, colIndex);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          this.selectedCells.push({ rowIndex: r, colIndex: c });
        }
      }
    }
  }

  /**
   * Verifica se uma célula está selecionada para aplicar estilos
   * @param {number} rowIndex
   * @param {number} colIndex
   * @return {*}  {boolean}
   * @memberof ExcelGridComponent
   */
  isCellSelected(rowIndex: number, colIndex: number): boolean {
    return this.selectedCells.some(
      (cell) => cell.rowIndex === rowIndex && cell.colIndex === colIndex
    );
  }

  /**
   * Retorna as classes de estilo
   * @param {number} rowIndex
   * @param {number} colIndex
   * @return {*}  {string}
   * @memberof ExcelGridComponent
   */
  getBorderClasses(rowIndex: number, colIndex: number): string {
    if (!this.isCellSelected(rowIndex, colIndex)) {
      return '';
    }

    let classes = '';
    const isTopEdge = !this.selectedCells.some(
      (cell) => cell.rowIndex === rowIndex - 1 && cell.colIndex === colIndex
    );
    const isBottomEdge = !this.selectedCells.some(
      (cell) => cell.rowIndex === rowIndex + 1 && cell.colIndex === colIndex
    );
    const isLeftEdge = !this.selectedCells.some(
      (cell) => cell.rowIndex === rowIndex && cell.colIndex === colIndex - 1
    );
    const isRightEdge = !this.selectedCells.some(
      (cell) => cell.rowIndex === rowIndex && cell.colIndex === colIndex + 1
    );

    if (isTopEdge) classes += ' border-top';
    if (isBottomEdge) classes += ' border-bottom';
    if (isLeftEdge) classes += ' border-left';
    if (isRightEdge) classes += ' border-right';

    // Adicionar classes para extremidades
    if (isBottomEdge && isRightEdge) classes += ' bottom-right-corner';

    return classes;
  }

  // getCellValue(rowIndex: number, colIndex: number): string {
  //   // Substitua pelo método real para obter o valor da célula
  //   return `${rowIndex},${colIndex}`;
  // }

  selectCell(rowIndex: number, colIndex: number) {
    this.selectedCells = [{ rowIndex, colIndex }];
    this.selectedRowIndex = rowIndex;
    this.selectedColIndex = colIndex;

    this.rowData.forEach((_, index) => {
      const row = this.table.nativeElement.rows[index + 1];
      if (row) {
        row.classList.remove('before-row-selected');
        Array.from(row.cells).forEach((cell: any, cellIndex) => {
          if (cellIndex > 0) {
            cell.classList.remove('highlighted');
          }
        });
      }
    });

    this.scrollIntoView(rowIndex, colIndex);
  }

  scrollIntoView(rowIndex: number, colIndex: number) {
    const cellIndex = rowIndex * this.columnDefs.length + colIndex;
    const cell = this.cells.toArray()[cellIndex];
    if (cell) {
      cell.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }

  isRowSelected(rowIndex: number): boolean {
    return this.selectedCells.some((cell) => cell.rowIndex === rowIndex);
  }

  isColSelected(colIndex: number): boolean {
    return this.selectedCells.some((cell) => cell.colIndex === colIndex);
  }

  selectRow(rowIndex: number) {
    this.selectedCells = [];

    this.columnDefs.forEach((_, index) => {
      this.selectedCells.push({ rowIndex: rowIndex, colIndex: index });
    });

    this.highlightRow(rowIndex);
  }

  selectCol(colIndex: number) {
    this.selectedCells = [];
    this.rowData.forEach((_, index) => {
      this.selectedCells.push({ rowIndex: index, colIndex: colIndex });
    });
  }

  /**
   * Seleciona todas as linhas e colunas da grid
   * @memberof ExcelGridComponent
   */
  selectAllCells(): void {
    this.selectedCells = [];
    for (let rowIndex = 0; rowIndex < this.rowData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.columnDefs.length; colIndex++) {
        this.selectedCells.push({ rowIndex, colIndex });
      }
    }
  }

  dropColumn(event: CdkDragDrop<string[]>): void {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;
    moveItemInArray(this.columnDefs, previousIndex, currentIndex);
    this.rowData.forEach((row) => {
      const keys = Object.keys(row);
      moveItemInArray(keys, previousIndex, currentIndex);
      this.reorderObjectKeys(row, keys);
    });
    this.adjustColumnWidths();
  }

  dropRow(event: CdkDragDrop<IRowData[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.rowData, event.previousIndex, event.currentIndex);
    }
    this.dragging = false;
  }

  reorderObjectKeys(obj: IRowData, newKeys: string[]): void {
    const newObj: IRowData = {} as IRowData;
    newKeys.forEach((key) => {
      newObj[key] = obj[key];
    });
    Object.assign(obj, newObj);
  }

  resetRowHeight(rowIndex: number): void {
    const row: HTMLTableRowElement | null = document.querySelector(
      `tr[row-index="${rowIndex}"]`
    );

    if (row) {
      // Resetar a altura das células baseado no conteúdo atual
      Array.from(row.cells).forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.height = 'auto';
      });

      // Após resetar a altura, setar novamente a altura máxima encontrada
      this.setInputHeight(rowIndex);
    }
  }

  adjustColumnWidths() {
    const tableElement = this.table.nativeElement as HTMLTableElement;
    const headerCells = tableElement.querySelectorAll('th');
    const bodyRows = tableElement.querySelectorAll('tbody tr');

    // Calculate the maximum width needed for each column
    const columnWidths: number[] = Array.from(headerCells).map(
      (headerCell, index) => {
        let maxWidth = this.getTextWidth(
          headerCell.textContent || '',
          window.getComputedStyle(headerCell).font
        );
        bodyRows.forEach((row) => {
          const cell = row.children[index] as HTMLElement;
          if (cell) {
            maxWidth = Math.max(
              maxWidth,
              this.getTextWidth(
                cell.textContent || '',
                window.getComputedStyle(cell).font
              )
            );
          }
        });
        return maxWidth + 16; // Add padding
      }
    );

    // Apply the calculated widths
    headerCells.forEach((headerCell, index) => {
      headerCell.style.width = `${columnWidths[index]}px`;
    });

    bodyRows.forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        (cell as HTMLElement).style.width = `${columnWidths[index]}px`;
      });
    });
  }

  getTextWidth(text: string, font: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
    return 0;
  }

  startDrag(event: CdkDragStart) {
    console.log('Drag started');
  }

  endDrag(event: CdkDragEnd) {
    console.log('Drag ended');
  }

  /**
   * Navegação
   * @param {KeyboardEvent} event
   * @memberof ExcelGridComponent
   */
  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    if (this.selectedCells.length > 0) {
      const lastSelectedCell =
        this.selectedCells[this.selectedCells.length - 1];
      const { rowIndex, colIndex } = lastSelectedCell;
      if (!(rowIndex < this.rowData.length - 1) && !this.editingCell) {
        this.addRow();
      }
      this.selectCell(rowIndex + 1, colIndex);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // console.log('HandleKeyboardEvent ->');
    const keyMap: {
      [key in ArrowKeys]: { rowChange: number; colChange: number };
    } = {
      ArrowDown: { rowChange: 1, colChange: 0 },
      ArrowUp: { rowChange: -1, colChange: 0 },
      ArrowRight: { rowChange: 0, colChange: 1 },
      ArrowLeft: { rowChange: 0, colChange: -1 },
    };

    if (
      this.selectedCells.length > 0 &&
      !this.editingCell &&
      event.key in keyMap
    ) {
      event.preventDefault(); // Evita a ação padrão das teclas de seta

      const lastSelectedCell =
        this.selectedCells[this.selectedCells.length - 1];
      const { rowIndex, colIndex } = lastSelectedCell;

      const isValidCell = (row: number, col: number): boolean => {
        return (
          row >= 0 &&
          row < this.rowData.length &&
          col >= 0 &&
          col < this.columnDefs.length
        );
      };

      const { rowChange, colChange } = keyMap[event.key as ArrowKeys];
      const newRow = rowIndex + rowChange;
      const newCol = colIndex + colChange;

      if (isValidCell(newRow, newCol)) {
        this.selectCell(newRow, newCol);
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // console.log('Ctrl + z ->', this.historyService)
    if (event.ctrlKey && event.key === 'c') {
      this.table.nativeElement.classList.add('copy-mode');
    } else if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.historyService.undo();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.historyService.redo();
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.table.nativeElement.classList.remove('copy-mode');
    }
  }

  /**
   * Adiciona uma nova linha na grid
   * @memberof ExcelGridComponent
   */
  addRow() {
    console.log('To caindo no add row');
    const newRow: IRowData = {
      garantidores: '',
      matricula: '',
      rgi: '',
      descricao: '',
      fracao_ideal: '',
      percent_garantido: '',
      valor_laudo: '',
      valor_af: '',
      zona_imovel: '',
      georreferenciamento: '',
      tipo: '',
      cidade: '',
    };
    this.rowData.push(newRow);
    this.filteredData = [...this.rowData];
  }

  highlightRow(rowIndex: number) {
    this.selectedRowIndex = rowIndex;

    // Remove highlight from all rows
    this.rowData.forEach((_, index) => {
      const row = this.table.nativeElement.rows[index + 1];
      row.classList.remove('before-row-selected');
      Array.from(row.cells).forEach((cell: any, cellIndex) => {
        if (cellIndex > 0) {
          cell.classList.remove('highlighted');
        }
      });
    });
    // Add highlight to the specified row
    const row = this.table.nativeElement.rows[rowIndex + 1];
    Array.from(row.cells).forEach((cell: any, cellIndex) => {
      if (cellIndex > 0) {
        cell.classList.add('highlighted');
      }
    });

    // Add row-before
    this.table.nativeElement.rows[rowIndex].classList.add(
      'before-row-selected'
    );
  }

  // Edit Cell Flow

  async enableEdit(rowIndex: number, colIndex: number): Promise<void> {
    await this.setInputHeight(rowIndex);
    this.editingCell = { rowIndex, colIndex };
    this.editedValue = this.rowData[rowIndex][this.columnDefs[colIndex].field];
    setTimeout(() => {
      if (this.inputElem) {
        this.inputElem.nativeElement.focus();
      }
    }, 0);
  }

  saveEdit(rowIndex: number, colIndex: number): void {
    const oldValue = this.rowData[rowIndex][this.columnDefs[colIndex].field];
    if (oldValue !== this.editedValue) {
      this.gridService.setCellValue(
        rowIndex,
        this.columnDefs[colIndex].field,
        this.editedValue
      );
    }
    this.editingCell = null;
    this.resetRowHeight(rowIndex);
  }

  // Filter Column
  openFilter(field: string): void {
    this.filterField = field;
    this.filterVisible = true;
    this.initializeFilterOptions();
  }

  initializeFilterOptions(): void {
    this.options = [
      ...new Set(this.rowData.map((row) => row[this.filterField])),
    ];
    this.filteredOptions = [...this.options];
    this.selectedOptions = [...this.options];
    this.allSelected = true;
  }

  filterOptions(): void {
    const lowerSearchText = this.searchText.toLowerCase();
    this.filteredOptions = this.options.filter((option) => {
      const optionText = String(option).toLowerCase();
      this.filterType === 'contains'
        ? optionText.includes(lowerSearchText)
        : optionText === lowerSearchText;
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.allSelected = checked;
    this.selectedOptions = checked ? [...this.options] : [];
  }

  toggleOption(option: T): void {
    const index = this.selectedOptions.indexOf(option);
    if (index > -1) {
      this.selectedOptions.splice(index, 1);
    } else {
      this.selectedOptions.push(option);
    }
    this.allSelected = this.selectedOptions.length === this.options.length;
  }

  applyFilter(): void {
    this.filterVisible = false;
    if (this.allSelected) {
      this.filteredData = [...this.rowData];
    } else {
      this.filteredData = this.rowData.filter((row) =>
        this.selectedOptions.includes(row[this.filterField])
      );
    }
  }

  // Context Menu
  showContextMenu(event: MouseEvent, column: any): void {
    event.preventDefault();
    this.contextMenuPosition = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`,
    };
    this.contextMenuVisible = true;
    this.rowContextMenuVisible = false;
  }

  // Add methods for context menu actions
  cut(): void {
    /* Implement cut logic */
  }
  copy(): void {
    /* Implement copy logic */
  }
  paste(): void {
    /* Implement paste logic */
  }
  orderAscending(): void {
    /* Implement order ascending logic */
  }
  orderDescending(): void {
    /* Implement order descending logic */
  }
  saveAs(): void {
    /* Implement save as logic */
  }
  about(): void {
    /* Implement about logic */
  }

  // Ações para menu das linhas

  showRowContextMenu(event: MouseEvent, rowIndex: number): void {
    event.preventDefault();
    this.selectRow(rowIndex);
    this.contextRowMenuPosition = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`,
    };
    this.rowContextMenuVisible = true;
    this.contextMenuVisible = false;
    this.selectedRowIndex = rowIndex;
  }

  @HostListener('document:click')
  hideContextMenu(): void {
    this.rowContextMenuVisible = false;
    this.contextMenuVisible = false;
  }

  // Métodos para as ações do menu de contexto
  insertRowAbove(): void {
    if (this.selectedRowIndex !== null) {
      this.rowData.splice(this.selectedRowIndex, 0, this.createEmptyRow());
      this.filteredData = [...this.rowData];
      this.rowContextMenuVisible = false;
    }
  }

  insertRowBelow(): void {
    if (this.selectedRowIndex !== null) {
      this.rowData.splice(this.selectedRowIndex + 1, 0, this.createEmptyRow());
      this.filteredData = [...this.rowData];
      this.rowContextMenuVisible = false;
    }
  }

  removeRow(): void {
    if (this.selectedRowIndex !== null) {
      this.gridService.removeRow(this.selectedRowIndex);
      this.rowContextMenuVisible = false;
      this.selectedRowIndex = null; // Limpar a seleção após a remoção
    }
  }

  removeColumns(): void {
    // Implementar a lógica para remover colunas
  }

  undo(): void {
    // Implementar a lógica para desfazer a última ação
  }

  redo(): void {
    // Implementar a lógica para refazer a última ação desfeita
  }

  setReadOnly(): void {
    // Implementar a lógica para definir a célula como somente leitura
  }

  setAlignment(): void {
    // Implementar a lógica para definir o alinhamento da célula
  }

  copyRow(): void {
    // Implementar a lógica para copiar a célula
  }

  cutRow(): void {
    // Implementar a lógica para cortar a célula
  }

  createEmptyRow(): IRowData {
    return {
      garantidores: '',
      matricula: '',
      rgi: '',
      descricao: '',
      fracao_ideal: '',
      percent_garantido: '',
      valor_laudo: '',
      valor_af: '',
      zona_imovel: '',
      georreferenciamento: '',
      tipo: '',
      cidade: '',
    };
  }

  // Utilities
  isTextTruncated(element: HTMLElement): boolean {
    console.log(element.scrollWidth > element.clientWidth);
    return element.scrollWidth > element.clientWidth;
  }
}
