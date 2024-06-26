import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-excel-table',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './excel-table.component.html',
  styleUrls: ['./excel-table.component.css'],
})
export class ExcelTableComponent implements AfterViewInit {
  columns: string[] = ['Idade', 'Header 2', 'Header 3'];
  data: string[][] = [
    ['14', 'Data 2', 'Data 3'],
    ['16', 'Data 5', 'Data 6'],
    ['18', 'Data 8', 'Data 9'],
  ];

  @ViewChild('excelTable') table!: ElementRef;

  ngAfterViewInit() {
    this.adjustColumnWidths();
  }

  dropColumn(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    this.data.forEach((row) =>
      moveItemInArray(row, event.previousIndex, event.currentIndex)
    );
    this.adjustColumnWidths();
  }

  dropRow(event: CdkDragDrop<string[][]>): void {
    moveItemInArray(this.data, event.previousIndex, event.currentIndex);
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
}
