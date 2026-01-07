import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [FormsModule, RouterOutlet],
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('prime');
}
