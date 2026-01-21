// @core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      // Check if token is expired
      if (this.authService.isTokenExpired()) {
        this.authService.signOut();
        return this.router.createUrlTree(['/auth/signin']);
      }
      return true;
    }

    // Not authenticated, redirect to sign in
    return this.router.createUrlTree(['/auth/signin']);
  }

  canActivateChild(): boolean | UrlTree {
    return this.canActivate();
  }
}
