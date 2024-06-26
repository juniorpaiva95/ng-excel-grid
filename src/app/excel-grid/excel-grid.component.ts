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
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

interface RowData {
  chassi: string;
  renavam: string;
  [key: string]: string; // Assinatura de índice para permitir indexação por strings
}

type ArrowKeys = 'ArrowDown' | 'ArrowUp' | 'ArrowRight' | 'ArrowLeft';

const keyMap: { [key in ArrowKeys]: { rowChange: number; colChange: number } } =
  {
    ArrowDown: { rowChange: 1, colChange: 0 },
    ArrowUp: { rowChange: -1, colChange: 0 },
    ArrowRight: { rowChange: 0, colChange: 1 },
    ArrowLeft: { rowChange: 0, colChange: -1 },
  };

@Component({
  selector: 'app-excel-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './excel-grid.component.html',
  styleUrls: ['./excel-grid.component.scss'],
})
export class ExcelGridComponent implements AfterViewInit {
  columnDefs = [
    { headerName: 'Chassi', field: 'chassi' },
    { headerName: 'Renavam', field: 'renavam' },
    { headerName: 'UF', field: 'uf' },
    { headerName: 'Placa', field: 'placa' },
  ];

  rowData: RowData[] = [
    {
      chassi: '9BD111060T5002156',
      renavam: '1234567890-1',
      uf: 'PB',
      placa: 'OGA-4832',
    },
    {
      chassi: '9BD111060T5002116',
      renavam: '1234567890-3',
      uf: 'SP',
      placa: 'OGA-4832',
    },
    {
      chassi: '9BD111060T5002186',
      renavam: '1234567890-7',
      uf: 'MG',
      placa: 'OGA-4832',
    },
    {
      chassi: '9BD111060T5002176',
      renavam: '1234567100-0',
      uf: 'PE',
      placa: 'OGA-4832',
    },
    {
      chassi: '9BD111060T5002196',
      renavam: '1234567890-9',
      uf: 'PI',
      placa: 'OGA-4832',
    },
  ];

  sortColumn: string = '';
  sortAsc: boolean = true;
  selecting = false;
  selectedCells: { rowIndex: number; colIndex: number }[] = [];
  startCell: { rowIndex: number; colIndex: number } | null = null;
  selectedRowIndex: number | null = null;
  selectedColIndex: number | null = null;
  dragging: boolean = false;
  editingCell: { rowIndex: number; colIndex: number } | null = null;
  editedValue: string = '';

  // Filter states
  filteredData = [...this.rowData];
  filterVisible = false;
  filterField = '';
  filterType = 'contains';
  searchText = '';
  allSelected = true;
  options: string[] = [];
  filteredOptions: string[] = [];
  selectedOptions: string[] = [];

  // Context Menu
  contextMenuVisible = false;
  contextMenuPosition = { x: '0px', y: '0px' };

  @ViewChild('excelTable') table!: ElementRef;

  @ViewChild('inputElem') inputElem!: ElementRef;

  ngAfterViewChecked() {
    if (this.inputElem && this.editingCell) {
      this.inputElem.nativeElement.focus();
      // this.setInputHeight();
    }
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

  dropRow(event: CdkDragDrop<RowData[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.rowData, event.previousIndex, event.currentIndex);
    }
    this.dragging = false;
  }

  reorderObjectKeys(obj: RowData, newKeys: string[]): void {
    const newObj: RowData = {} as RowData;
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
      console.log(
        rowIndex,
        this.rowData.length - 1,
        !(rowIndex < this.rowData.length - 1)
      );
      if (!(rowIndex < this.rowData.length - 1)) {
        this.addRow();
      }
      this.selectCell(rowIndex + 1, colIndex);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.selectedCells.length > 0 && !this.editingCell) {
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

      const keyMap = {
        ArrowDown: { rowChange: 1, colChange: 0 },
        ArrowUp: { rowChange: -1, colChange: 0 },
        ArrowRight: { rowChange: 0, colChange: 1 },
        ArrowLeft: { rowChange: 0, colChange: -1 },
      };

      const key = event.key as keyof typeof keyMap;

      if (keyMap[key]) {
        const { rowChange, colChange } = keyMap[key];
        const newRow = rowIndex + rowChange;
        const newCol = colIndex + colChange;

        if (isValidCell(newRow, newCol)) {
          this.selectCell(newRow, newCol);
        }
      }
    }
  }
  /**
   * Adiciona uma nova linha na grid
   * @memberof ExcelGridComponent
   */
  addRow() {
    console.log('To caindo no add row');
    const newRow: RowData = { chassi: '', renavam: '', uf: '', placa: '' };
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
    this.rowData[rowIndex][this.columnDefs[colIndex].field] = this.editedValue;
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
    this.filteredOptions = this.options.filter((option) =>
      this.filterType === 'contains'
        ? option.toLowerCase().includes(lowerSearchText)
        : option.toLowerCase() === lowerSearchText
    );
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.allSelected = checked;
    this.selectedOptions = checked ? [...this.options] : [];
  }

  toggleOption(option: string): void {
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

  @HostListener('document:click')
  hideContextMenu(): void {
    this.contextMenuVisible = false;
  }

  showContextMenu(event: MouseEvent, column: any): void {
    event.preventDefault();
    this.contextMenuPosition = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`,
    };
    this.contextMenuVisible = true;
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
  insertColumnBefore(): void {
    /* Implement insert column before logic */
  }
  insertColumnAfter(): void {
    /* Implement insert column after logic */
  }
  deleteSelectedColumns(): void {
    /* Implement delete selected columns logic */
  }
  renameColumn(): void {
    /* Implement rename column logic */
  }
  orderAscending(): void {
    /* Implement order ascending logic */
  }
  orderDescending(): void {
    /* Implement order descending logic */
  }
  hideColumn(): void {
    /* Implement hide column logic */
  }
  showColumn(): void {
    /* Implement show column logic */
  }
  saveAs(): void {
    /* Implement save as logic */
  }
  about(): void {
    /* Implement about logic */
  }
}
