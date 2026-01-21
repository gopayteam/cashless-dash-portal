import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive to show/hide elements based on user roles
 * 
 * Usage:
 * <button *hasRole="'CAN_ADD_USER'">Add User</button>
 * <div *hasRole="['CAN_VIEW_DRIVER', 'CAN_EDIT_DRIVER']">Driver Management</div>
 * 
 * Place this file in: src/app/@core/directives/has-role.directive.ts
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private requiredRoles: string[] = [];

  @Input() set hasRole(roles: string | string[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {
    // React to changes in user roles (useful when user logs in/out)
    effect(() => {
      // Access the roles signal to track changes
      this.authService.roles();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    this.viewContainer.clear();

    // If no roles required, show the element
    if (this.requiredRoles.length === 0) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    // Check if user has any of the required roles
    const hasAccess = this.authService.hasAnyRole(this.requiredRoles);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}