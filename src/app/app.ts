import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { RouterOutlet } from '@angular/router';


export const MY_DATE_FORMATS = {
  parse: { dateInput: 'M/d/yyyy' },
  display: {
    dateInput: 'M/d/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};



@Component({
  imports: [FormsModule, RouterOutlet],
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
})
export class App {
  protected readonly title = signal('prime');
}
