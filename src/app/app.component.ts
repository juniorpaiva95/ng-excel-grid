import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExcelGridComponent } from './excel-grid/excel-grid.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExcelGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ag-excel';
}
