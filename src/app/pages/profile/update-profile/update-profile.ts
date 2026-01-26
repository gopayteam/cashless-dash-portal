import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-profile.html',
  styleUrls: ['./update-profile.css']
})
export class UserProfileComponent {
  settingsForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.fb.group({
      username: ['', Validators.required],
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userId: ['', Validators.required]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  passwordMismatch(): boolean {
    const newPassword = this.settingsForm.get('newPassword');
    const confirmPassword = this.settingsForm.get('confirmPassword');
    return !!(
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value &&
      (confirmPassword.dirty || confirmPassword.touched || this.submitted)
    );
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.settingsForm.valid && !this.passwordMismatch()) {
      console.log('Form submitted:', this.settingsForm.value);
      // Handle form submission here
      alert('Form submitted successfully!');
    } else {
      console.log('Form is invalid');
    }
  }
}
