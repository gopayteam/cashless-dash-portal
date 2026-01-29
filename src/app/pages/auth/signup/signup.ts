// pages/auth/signup/signup.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
  selector: 'app-signup',
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
    MatFormFieldModule
],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css',]
})
export class SignUpComponent implements OnInit {
  signUpForm!: FormGroup;
  submitted = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public loadingStore: LoadingStore,
    private messageService: MessageService
  ) {}

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
    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^0[17]\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Validate form
    if (this.signUpForm.invalid) {
      this.markFormGroupTouched(this.signUpForm);

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

    // Build sign-up data object
    const signUpData = {
      firstName: this.signUpForm.value.firstName,
      lastName: this.signUpForm.value.lastName,
      username: this.signUpForm.value.username,
      email: this.signUpForm.value.email,
      phoneNumber: this.signUpForm.value.phoneNumber,
      password: this.signUpForm.value.password,
      channel: 'PORTAL',
      entityId: 'GS00000'
    };

    this.authService.signUp(signUpData).subscribe({
      next: (response: any) => {
        console.log('Sign up successful', response);
        this.loadingStore.stop();

        // Show success toast
        this.messageService.add({
          severity: 'success',
          summary: 'Account Created!',
          detail: `Welcome ${this.signUpForm.value.firstName}! Your account has been created successfully.`,
          life: 3000
        });

        // Redirect to sign-in page after short delay
        setTimeout(() => {
          this.router.navigate(['/auth/signin']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Sign up failed', error);
        this.loadingStore.stop();

        const errorMsg = error.error?.message || 'Registration failed. Please try again.';
        this.errorMessage = errorMsg;

        // Show error toast
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: errorMsg,
          life: 5000
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signUpForm.get(fieldName);

    // Check for password mismatch on confirmPassword field
    if (fieldName === 'confirmPassword' && this.signUpForm.hasError('passwordMismatch')) {
      return !!(field && (field.dirty || field.touched || this.submitted));
    }

    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signUpForm.get(fieldName);

    if (fieldName === 'confirmPassword' && this.signUpForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (field?.hasError('pattern')) {
      if (fieldName === 'phoneNumber') {
        return 'Please enter a valid phone number (e.g., 0712345678)';
      }
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      username: 'Username',
      email: 'Email',
      phoneNumber: 'Phone number',
      password: 'Password',
      confirmPassword: 'Confirm password'
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
