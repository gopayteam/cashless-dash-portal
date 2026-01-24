// pages/auth/signin/signin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule,
    DividerModule,
  ],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css']
})
export class SignInComponent implements OnInit {
  signInForm!: FormGroup;
  submitted = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public loadingStore: LoadingStore,
    private messageService: MessageService
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard/home']);
      return;
    }

    this.initForm();
  }

  initForm(): void {
    this.signInForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Validate form
    if (this.signInForm.invalid) {
      this.markFormGroupTouched(this.signInForm);

      // Show validation error toast
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly',
        life: 4000
      });
      return;
    }

    this.loadingStore.start();

    // Build credentials object including extra fields
    const credentials = {
      ...this.signInForm.value, // username + password from form
      channel: 'PORTAL',        // hard-coded or dynamically set
      entityId: 'GS00000'       // hard-coded or dynamically set
    };

    this.authService.signIn(credentials).subscribe({
      next: (response: any) => {
        console.log('Sign in successful', response);
        this.loadingStore.stop();

        // Get username from form or response
        const username = response.data?.username ||
          response.data?.name ||
          this.signInForm.value.username;

        // Show success toast
        this.messageService.add({
          severity: 'success',
          summary: 'Sign In Successful',
          detail: `Welcome back, ${username}!`,
          life: 3000
        });

        // Redirect to dashboard after short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard/home']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Sign in failed', error);
        this.loadingStore.stop();

        // Extract error message from different possible locations
        const errorMsg =
          error?.error?.message ||           // From our thrown error in AuthService
          error?.message ||                  // Direct error message
          error?.error?.error?.message ||    // Nested error structure
          'Invalid username or password. Please try again.'; // Fallback

        this.errorMessage = errorMsg;

        // Show error toast
        this.messageService.add({
          severity: 'error',
          summary: 'Sign In Failed',
          detail: errorMsg,
          life: 5000
        });

        // Optional: Reset password field on error
        // this.signInForm.patchValue({ password: '' });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signInForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signInForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Username',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
