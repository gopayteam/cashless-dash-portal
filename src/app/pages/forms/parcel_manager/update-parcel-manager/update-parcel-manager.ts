// pages/parcel-managers/update-parcel-manager/update-parcel-manager.component.ts
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
import { DataService } from '../../../../../@core/api/data.service';
import { LoadingStore } from '../../../../../@core/state/loading.store';
import { AuthService } from '../../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';
import { Stage } from '../../../../../@core/models/locations/stage.model';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParcelDetailsApiResponse } from '../../../../../@core/models/parcels/parcel_stage_response';
import { User } from '../../../../../@core/models/user/user.model';
import { UserApiResponse } from '../../../../../@core/models/user/user_api_Response.mode';

interface DropdownOption {
  label: string;
  value: any;
}

interface UpdateParcelManagerPayload {
  id: number;
  entityId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: string;
  channel: string;
  agent: string;
  stageId: number;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any[];
  totalRecords?: number;
}

@Component({
  selector: 'app-update-parcel-manager',
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
  templateUrl: './update-parcel-manager.html',
  styleUrls: ['./update-parcel-manager.css', '../../../../../styles/global/_toast.css'],
  providers: [MessageService]
})
export class UpdateParcelManagerComponent implements OnInit {
  entityId: string | null = null;
  managerId: number | null = null;
  managerUsername: string | null = null;
  userData: User | null = null;

  // Form fields
  userId: number | null = null;
  phoneNumber: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  selectedStage: number | null = null;

  // Constants
  readonly PROFILE = 'PARCEL';
  readonly CHANNEL = 'PORTAL';
  readonly AGENT = 'PARCEL';

  // Dropdown options
  stageOptions: DropdownOption[] = [];

  // Loading states
  stagesLoading: boolean = false;
  userLoading: boolean = false;
  submitting: boolean = false;
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
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.entityId = user.entityId;

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Manager ID not found in route',
          life: 4000
        });
        this.router.navigate(['/users/parcel-managers']);
        return;
      }

      this.managerId = +id;
      this.userId = +id;
      this.initializeUserData();
    });

    this.loadStages();
  }

  private initializeUserData(): void {
    const stateUser = this.getUserFromState();

    if (stateUser) {
      console.log('✓ Manager data loaded from navigation state');
      this.populateFormFromUser(stateUser);
      this.dataLoadedFromState = true;
    } else {
      console.log('⚠ No state data found, fetching from API');
      this.loadUserDataFromAPI(this.userId!);
      this.dataLoadedFromState = false;
    }
  }

  private getUserFromState(): User | null {
    try {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['manager']) {
        const stateUser = navigation.extras.state['manager'] as User;
        if (this.isValidUserObject(stateUser)) {
          return stateUser;
        }
      }

      if (window.history.state?.manager) {
        const historyUser = window.history.state.manager as User;
        if (this.isValidUserObject(historyUser)) {
          return historyUser;
        }
      }

      return null;
    } catch (error) {
      console.error('Error retrieving manager from state:', error);
      return null;
    }
  }

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

  private populateFormFromUser(user: User): void {
    this.userData = user;
    this.userId = user.id;
    this.managerId = user.id;
    this.firstName = user.firstName || '';
    this.lastName = user.lastName || '';
    this.phoneNumber = user.phoneNumber || '';
    this.email = user.email || '';
    this.selectedStage = null; // Or set to a default/existing value if available

    // console.log('Form populated with manager data:', {
    //   id: this.userId,
    //   name: `${this.firstName} ${this.lastName}`,
    //   email: this.email
    // });
  }

  private loadUserDataFromAPI(userId: number): void {
    if (!this.entityId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Entity ID not found',
        life: 4000
      });
      this.router.navigate(['/users/parcel-managers']);
      return;
    }

    this.userLoading = true;
    this.loadingStore.start();

    const payload = {
      entityId: this.entityId,
      agent: this.AGENT,
      page: 0,
      size: 100
    };

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'get-parcel-managers')
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const user = response.data.find((u: User) => u.id === userId);

            if (user) {
              console.log('✓ Manager data fetched successfully from API');
              this.populateFormFromUser(user);
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
          console.error('Failed to load manager data from API:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch manager data. Please try again.',
            life: 4000
          });
          this.userLoading = false;
          this.loadingStore.stop();
          this.router.navigate(['/users/parcel-managers']);
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
      this.router.navigate(['/users/parcel-managers']);
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
      this.router.navigate(['/users/parcel-managers']);
    }, 2000);
  }


  loadStages(): void {
    if (!this.entityId) {
      return;
    }

    this.stagesLoading = true;
    const params = {
      entityId: this.entityId,
      page: 0,
      size: 100,
      startDate: null,
      endDate: null,
    };

    this.dataService
      .get<ParcelDetailsApiResponse>(API_ENDPOINTS.ALL_PARCEL_STAGES, params, 'all-parcel-stages')
      .subscribe({
        next: (response) => {
          this.stageOptions = response.data.map((stage: Stage) => ({
            label: `${stage.name} (${stage.id || 'N/A'})`,
            value: stage.id,
          }));
          this.stagesLoading = false;
        },
        error: (err) => {
          console.error('Failed to load stages', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load stages',
            life: 4000
          });
          this.stagesLoading = false;
        },
      });
  }

  isFormValid(): boolean {
    return !!(
      this.phoneNumber.trim() &&
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email) &&
      this.selectedStage !== null &&
      this.userId !== null
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone: string): boolean {
    // Basic validation for phone number (adjust based on your requirements)
    const phoneRegex = /^254\d{9}$/;
    return phoneRegex.test(phone);
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
        detail: 'Invalid phone number format. Must start with 254 and be 12 digits',
        life: 4000
      });
      return;
    }

    const payload: UpdateParcelManagerPayload = {
      id: this.userId,
      entityId: this.entityId,
      phoneNumber: this.phoneNumber.trim(),
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      profile: this.PROFILE,
      channel: this.CHANNEL,
      agent: this.AGENT,
      stageId: this.selectedStage!,
    };

    console.log('Submitting payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.UPDATE_PARCEL_MANAGER, payload, 'update-parcel-manager')
      .subscribe({
        next: (response) => {
          console.log('Parcel manager updated successfully', response);
          this.submitting = false;
          this.loadingStore.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Parcel manager updated successfully',
            life: 4000
          });

          // Navigate back to parcel managers list page
          setTimeout(() => {
            this.router.navigate(['/users/parcel-managers']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to update parcel manager - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.error?.message);
          console.error('Error details:', err.error);

          // More detailed error message
          let errorMessage = 'Failed to update parcel manager';

          if (err.status === 500) {
            errorMessage = 'Server error occurred. Please check if all required fields are correct.';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Invalid data provided. Please check your inputs.';
          } else if (err.status === 404) {
            errorMessage = 'User or endpoint not found.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage =
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Unknown server error';
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
    this.router.navigate(['/users/parcel-managers']);
  }
}
