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
import { DataService } from '../../../../@core/api/data.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { Stage } from '../../../../@core/models/locations/stage.model';
import { ParcelManager } from '../../../../@core/models/parcels/parcel_manager.model';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParcelDetailsApiResponse } from '../../../../@core/models/parcels/parcel_stage_response';

interface DropdownOption {
  label: string;
  value: any;
}

interface UpdateParcelManagerPayload {
  username: string;
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
  totalRecords: number;
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
  styleUrls: ['./update-parcel-manager.css', '../../../../styles/global/_toast.css'],
})
export class UpdateParcelManagerComponent implements OnInit {
  entityId: string | null = null;
  managerUsername: string | null = null;
  managerData: ParcelManager | null = null;

  userId: string = '';

  // Form fields
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
  managerLoading: boolean = false;
  submitting: boolean = false;

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
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    const navigation = this.router.getCurrentNavigation();
    const stateManager = navigation?.extras?.state?.['manager'] as ParcelManager;

    this.route.params.subscribe(params => {
      const username = params['username'];
      this.managerUsername = username;

      if (stateManager) {
        // Came from navigation (best case)
        this.populateFormFromManager(stateManager);
      } else {
        // Page refreshed or direct URL
        this.loadManagerData(username);
      }
    });



    this.loadStages();
  }

  populateFormFromManager(manager: ParcelManager): void {
    this.managerData = manager;

    // Split userName into firstName and lastName (assuming format: "FirstName LastName")
    const nameParts = manager.userName.split(' ');
    this.userId = manager.userName;
    this.firstName = nameParts[0] || '';
    this.lastName = nameParts.slice(1).join(' ') || '';

    this.phoneNumber = manager.userPhone;
    // Email might not be in ParcelManager model, so we'll leave it empty or fetch from API
    this.email = '';

    // Note: stageId is not in the ParcelManager model
    // You'll need to either fetch it from API or add it to the model
    this.selectedStage = null;

    this.loadingStore.stop();
  }

  loadManagerData(username: string): void {
    this.managerLoading = true;
    this.loadingStore.start();

    const payload = {
      entityId: this.entityId,
      username: username,
      page: 0,
      size: 1,
      transactionType: 'DEBIT',
      paymentStatus: 'PAID',
    };

    this.dataService
      .post<any>(API_ENDPOINTS.ALL_PARCEL_MANAGERS, payload, 'parcel-managers')
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const manager = response.data[0];
            this.populateFormFromManager(manager);

            this.messageService.add({
              severity: 'info',
              summary: 'fetched  successfully',
              detail: 'Parcel manager data fetched successfully',
              life: 4000
            });

            // If you have an endpoint to get full user details including email and stageId
            // You should call it here to get complete information
            this.loadFullManagerDetails(username);
          } else {

            this.messageService.add({
              severity: 'warn',
              summary: 'Error occurred',
              detail: 'Parcel manager data failed to fetch, please contact support',
              life: 4000
            });
            console.error('Manager not found');
            this.router.navigate(['/parcel-managers']);
          }
          this.managerLoading = false;
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load manager data', err);
          this.managerLoading = false;
          this.loadingStore.stop();
          // this.router.navigate(['/parcel-managers']);
        },
      });
  }

  loadFullManagerDetails(username: string): void {
    // Add endpoint to fetch full user details including email and stageId
    // This is a placeholder - adjust based on your actual API
    const payload = {
      username: username,
      entityId: this.entityId,
    };

    // Example: Uncomment and adjust when you have the endpoint
    /*
    this.dataService
      .post<any>(API_ENDPOINTS.GET_PARCEL_MANAGER_DETAILS, payload, 'manager-details')
      .subscribe({
        next: (response) => {
          this.email = response.data.email;
          this.selectedStage = response.data.stageId;

          this.messageService.add({
              severity: 'info',
              summary: 'fetched  successfully',
              detail: 'Parcel manager data fetched successfully',
              life: 4000
            });

        },
        error: (err) => {
          console.error('Failed to load full manager details', err);

          this.messageService.add({
              severity: 'warn',
              summary: 'Error occurred',
              detail: 'Failed to load full manager details, please contact support',
              life: 4000
          });
        },
      });
    */
  }

  loadStages(): void {
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
      this.selectedStage
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone: string): boolean {
    // Basic validation for phone number (adjust based on your requirements)
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId || !this.managerUsername) {
      return;
    }

    if (!this.isValidPhoneNumber(this.phoneNumber)) {
      console.error('Invalid phone number format');
      return;
    }

    const payload: UpdateParcelManagerPayload = {
      username: this.managerUsername,
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
            summary: 'Updated successfully',
            detail: 'Parcel manager updated successfully',
            life: 4000
          });

          // Navigate back to parcel managers list page
          this.router.navigate(['/parcel-managers']);
        },
        error: (err) => {
          console.error('Failed to update parcel manager', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error Occurred',
            detail: 'Failed to update parcel manager',
            life: 4000
          });
          this.submitting = false;
          this.loadingStore.stop();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/parcel-managers']);
  }
}
