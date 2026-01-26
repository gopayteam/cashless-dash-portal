// shared/components/action-button/action-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './action-button.html',
  styleUrls: ['./action-button.css'],
})
export class ActionButtonComponent {
  @Input() icon: string = 'pi-plus'; // PrimeNG icon class
  @Input() label: string = ''; // Optional text label
  @Input() tooltip: string = ''; // Tooltip text
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() rounded: boolean = true; // Circular button
  @Input() outlined: boolean = false;
  @Output() clicked = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  get buttonClasses(): string {
    const classes = ['action-btn'];

    // Variant
    classes.push(`btn-${this.variant}`);

    // Size
    classes.push(`btn-${this.size}`);

    // Shape
    if (this.rounded && !this.label) {
      classes.push('btn-rounded');
    }

    // Outlined
    if (this.outlined) {
      classes.push('btn-outlined');
    }

    // States
    if (this.disabled) {
      classes.push('btn-disabled');
    }

    if (this.loading) {
      classes.push('btn-loading');
    }

    // Has label
    if (this.label) {
      classes.push('btn-with-label');
    }

    return classes.join(' ');
  }
}
