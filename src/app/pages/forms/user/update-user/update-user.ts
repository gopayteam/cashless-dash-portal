// pages/users/update-user/update-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../../@core/api/data.service';
import { LoadingStore } from '../../../../../@core/state/loading.store';
import { AuthService } from '../../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';
import { User } from '../../../../../@core/models/user/user.model';
import { UserApiResponse } from '../../../../../@core/models/user/user_api_Response.mode';

interface DropdownOption {
  label: string;
  value: string;
}

interface UpdateUserPayload {
  id: number;
  agent: string;
  channel: string;
  email: string;
  entityId: string;
  firstName: string;
  idNumber: string;
  lastName: string;
  phoneNumber: string;
  profile: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
    TooltipModule,
    MessageModule,
    ToastModule,
  ],
  templateUrl: './update-user.html',
  styleUrls: ['./update-user.css', '../../../../../styles/global/_toast.css'],
  providers: [MessageService]
})
export class UpdateUserComponent implements OnInit {
  entityId: string | null = null;
  userId: number | null = null;
  userData: User | null = null;

  // Constants
  readonly PROFILE = 'ADMIN';
  readonly CHANNEL = 'PORTAL';
  readonly AGENT = 'ADMIN';

  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phoneNumber: string = '';
  idNumber: string = '';
  selectedProfile: string = '';
  selectedAgent: string = '';
  selectedChannel: string = '';

  // Dropdown options
  profileOptions: DropdownOption[] = [
    { label: 'Dashmaster', value: 'DASHMASTER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Passenger', value: 'USER' },
    { label: 'Parcel', value: 'PARCEL' },
    { label: 'Marshal', value: 'MARSHAL' },
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Conductor', value: 'CONDUCTOR' },
    { label: 'Investor', value: 'INVESTOR' },
    { label: 'Approver', value: 'APPROVER' },
    { label: 'Inspector', value: 'INSPECTOR' },
  ];

  agentOptions: DropdownOption[] = [
    { label: 'Dashmaster', value: 'DASHMASTER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Passenger', value: 'PASSENGER' },
    { label: 'Parcel', value: 'PARCEL' },
    { label: 'Marshal', value: 'MARSHAL' },
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Conductor', value: 'CONDUCTOR' },
    { label: 'Investor', value: 'INVESTOR' },
    { label: 'Approver', value: 'APPROVER' },
    { label: 'Inspector', value: 'INSPECTOR' },
  ];

  channelOptions: DropdownOption[] = [
    { label: 'Portal', value: 'PORTAL' },
    { label: 'App', value: 'APP' },
    { label: 'Web', value: 'WEB' },
  ];

  // Loading states
  userLoading: boolean = false;
  submitting: boolean = false;

  // Flag to track data source
  dataLoadedFromState: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    // Check authentication
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.entityId = user.entityId;

    // Get user ID from route params
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'User ID not found in route',
          life: 4000
        });
        this.router.navigate(['/users/all']);
        return;
      }

      this.userId = +id;
      this.initializeUserData();
    });
  }

  /**
   * Initialize user data with priority:
   * 1. Try to get from navigation state (immediate, no API call needed)
   * 2. Fall back to API fetch if state is unavailable
   */
  private initializeUserData(): void {
    // Attempt to get user data from navigation state
    const stateUser = this.getUserFromState();

    if (stateUser) {
      console.log('✓ User data loaded from navigation state');
      this.populateFormFromUser(stateUser);
      this.dataLoadedFromState = true;
    } else {
      console.log('⚠ No state data found, fetching from API');
      this.loadUserDataFromAPI(this.userId!);
      this.dataLoadedFromState = false;
    }
  }

  /**
   * Attempts to retrieve user data from router navigation state
   * Returns null if state is unavailable or invalid
   */
  private getUserFromState(): User | null {
    try {
      // First attempt: Get from current navigation
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['user']) {
        const stateUser = navigation.extras.state['user'] as User;
        if (this.isValidUserObject(stateUser)) {
          return stateUser;
        }
      }

      // Second attempt: Check history state (for page refresh scenarios)
      if (window.history.state?.user) {
        const historyUser = window.history.state.user as User;
        if (this.isValidUserObject(historyUser)) {
          return historyUser;
        }
      }

      return null;
    } catch (error) {
      console.error('Error retrieving user from state:', error);
      return null;
    }
  }

  /**
   * Validates that the user object has all required fields
   */
  private isValidUserObject(user: any): boolean {
    return !!(
      user &&
      typeof user === 'object' &&
      user.id &&
      user.firstName &&
      user.lastName &&
      user.email &&
      user.phoneNumber &&
      user.profile &&
      user.agent &&
      user.channel
    );
  }

  /**
   * Populate form fields from user object
   */
  private populateFormFromUser(user: User): void {
    this.userData = user;
    this.userId = user.id;
    this.firstName = user.firstName || '';
    this.lastName = user.lastName || '';
    this.phoneNumber = user.phoneNumber || '';
    this.email = user.email || '';
    this.idNumber = user.idNumber || '';
    this.selectedProfile = user.profile || '';
    this.selectedAgent = user.agent || '';
    this.selectedChannel = user.channel || '';

    // console.log('Form populated with user data:', {
    //   id: this.userId,
    //   name: `${this.firstName} ${this.lastName}`,
    //   email: this.email
    // });
  }

  /**
   * Fallback method to load user data from API
   */
  private loadUserDataFromAPI(userId: number): void {
    if (!this.entityId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Entity ID not found',
        life: 4000
      });
      this.router.navigate(['/users/all']);
      return;
    }

    this.userLoading = true;
    this.loadingStore.start();

    const payload = {
      entityId: this.entityId,
      page: 0,
      size: 100
    };

    console.log('Fetching user data from API for ID:', userId);

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'get-users')
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const user = response.data.find((u: User) => u.id === userId);

            if (user) {
              console.log('✓ User data fetched successfully from API');
              this.populateFormFromUser(user);

              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'User data loaded successfully',
                life: 3000
              });
            } else {
              this.handleUserNotFound(userId);
            }
          } else {
            this.handleNoUsersAvailable();
          }

          this.userLoading = false;
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load user data from API:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch user data. Please try again.',
            life: 4000
          });
          this.userLoading = false;
          this.loadingStore.stop();
          this.router.navigate(['/users/all']);
        },
      });
  }

  private handleUserNotFound(userId: number): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: `User with ID ${userId} not found`,
      life: 4000
    });
    console.error('User not found with ID:', userId);
    setTimeout(() => {
      this.router.navigate(['/users/all']);
    }, 2000);
  }

  private handleNoUsersAvailable(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'No user data available',
      life: 4000
    });
    console.error('No users found in API response');
    setTimeout(() => {
      this.router.navigate(['/users/all']);
    }, 2000);
  }

  isFormValid(): boolean {
    return !!(
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email) &&
      this.phoneNumber.trim() &&
      this.idNumber.trim() &&
      this.selectedProfile &&
      this.selectedAgent &&
      this.selectedChannel &&
      this.userId !== null
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone: string): boolean {
    // Accepts both formats: 254XXXXXXXXX or 07XXXXXXXX
    const phoneRegex1 = /^254\d{9}$/;
    const phoneRegex2 = /^0[17]\d{8}$/;
    return phoneRegex1.test(phone) || phoneRegex2.test(phone);
  }

  isValidIdNumber(idNumber: string): boolean {
    // Kenyan ID numbers are typically 7-8 digits
    const idRegex = /^\d{7,8}$/;
    return idRegex.test(idNumber);
  }

  normalizePhoneNumber(phone: string): string {
    // Convert 07XXXXXXXX to 254XXXXXXXXX
    if (phone.startsWith('0')) {
      return '254' + phone.substring(1);
    }
    return phone;
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId || this.userId === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly',
        life: 4000
      });
      return;
    }

    if (!this.isValidPhoneNumber(this.phoneNumber)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX',
        life: 4000
      });
      return;
    }

    if (!this.isValidIdNumber(this.idNumber)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Invalid ID number. Must be 7-8 digits',
        life: 4000
      });
      return;
    }

    const normalizedPhone = this.normalizePhoneNumber(this.phoneNumber.trim());

    const payload: UpdateUserPayload = {
      id: this.userId,
      agent: this.selectedAgent,
      channel: this.selectedChannel,
      email: this.email.trim().toLowerCase(),
      entityId: this.entityId,
      firstName: this.firstName.trim(),
      idNumber: this.idNumber.trim(),
      lastName: this.lastName.trim(),
      phoneNumber: normalizedPhone,
      profile: this.selectedProfile,
    };

    console.log('Updating user with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.UPDATE_USER, payload, 'update-admin-user')
      .subscribe({
        next: (response) => {
          console.log('User updated successfully', response);
          this.submitting = false;
          this.loadingStore.stop();

          if (response.status == 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'User updated successfully',
              life: 4000
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error Occurred',
              detail: response.message,
              life: 5000
            });

          }

          // Navigate back to users list after a short delay
          setTimeout(() => {
            this.router.navigate(['/users/all']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to update user - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error details:', err.error);

          let errorMessage = 'Failed to update user';

          if (err.status === 409) {
            errorMessage = 'User with this email or phone number already exists';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Invalid data provided. Please check your inputs.';
          } else if (err.status === 404) {
            errorMessage = 'User not found';
          } else if (err.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error Occurred',
            detail: errorMessage,
            life: 5000
          });

          this.submitting = false;
          this.loadingStore.stop();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/users/all']);
  }

  /**
   * Debug method to check current data source
   */
  getDataSource(): string {
    return this.dataLoadedFromState ? 'Navigation State' : 'API Fetch';
  }
}