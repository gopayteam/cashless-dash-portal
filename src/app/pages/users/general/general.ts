// pages/users/all-users.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { User } from '../../../../@core/models/user/user.model';
import { UserApiResponse } from '../../../../@core/models/user/user_api_Response.mode';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

import * as XLSX from 'xlsx';

interface ProfileOption {
  label: string;
  value: string;
}

interface AgentOption {
  label: string;
  value: string;
}

interface ChannelOption {
  label: string;
  value: string;
}

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-general-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ActionButtonComponent,
    MessageModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './general.html',
  styleUrls: [
    './general.css',
    '../../../../styles/modules/_cards.css',
    '../../../../styles/modules/_user_module.css',
    '../../../../styles/modules/_filter_actions.css',
    '../../../../styles/global/_toast.css',
  ],
  providers: [MessageService, ConfirmationService]
})
export class GeneralUserComponent implements OnInit {
  entityId: string | null = null;
  users: User[] = [];
  allUsers: User[] = [];
  filteredUsers: User[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedProfile: string = '';
  selectedChannel: string = '';
  selectedStatus: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedUser: User | null = null;

  // Summary stats
  totalUsers: number = 0;
  activeUsers: number = 0;
  blockedUsers: number = 0;
  firstLoginUsers: number = 0;

  // Dropdown options
  profileOptions: ProfileOption[] = [
    { label: 'All Profiles', value: '' },
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

  agentOptions: AgentOption[] = [
    { label: 'All Agents', value: '' },
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

  channelOptions: ChannelOption[] = [
    { label: 'All Channels', value: '' },
    { label: 'App', value: 'APP' },
    { label: 'Portal', value: 'PORTAL' },
    { label: 'Web', value: 'WEB' },
  ];

  statusOptions: StatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Blocked', value: 'blocked' },
  ];

  private lastEvent: any;

  exportingCurrent: boolean = false;
  exportingAll: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.loadUsers();
  }

  loadUsers($event?: any): void {
    this.lastEvent = $event;
    this.fetchUsers(false, $event);
  }

  fetchUsers(bypassCache: boolean, $event?: any): void {
    const event = $event;

    // Handle pagination from PrimeNG lazy load event
    let page = 0;
    let pageSize = this.rows;

    if (event && event.first !== undefined) {
      page = event.first / event.rows;
      pageSize = event.rows;
      this.first = event.first;
      this.rows = event.rows;
    }
    const payload = {
      entityId: this.entityId,
      page,
      size: pageSize,
    };

    this.loadingStore.start();

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'general-users', bypassCache)
      .subscribe({
        next: (response) => {
          this.allUsers = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load all users', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  calculateStats(): void {
    this.totalUsers = this.totalRecords;
    this.activeUsers = this.allUsers.filter(u => !u.blocked).length;
    this.blockedUsers = this.allUsers.filter(u => u.blocked).length;
    this.firstLoginUsers = this.allUsers.filter(u => u.firstLogin).length;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allUsers];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.includes(searchLower) ||
          user.idNumber?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply profile filter
    if (this.selectedProfile && this.selectedProfile !== '') {
      filtered = filtered.filter(user => user.profile === this.selectedProfile);
    }

    // Apply channel filter
    if (this.selectedChannel && this.selectedChannel !== '') {
      filtered = filtered.filter(user => user.channel === this.selectedChannel);
    }

    // Apply status filter
    if (this.selectedStatus && this.selectedStatus !== '') {
      if (this.selectedStatus === 'active') {
        filtered = filtered.filter(user => !user.blocked);
      } else if (this.selectedStatus === 'blocked') {
        filtered = filtered.filter(user => user.blocked);
      }
    }

    this.filteredUsers = filtered;
    this.users = filtered;

    if (this.selectedUser) {
      const exists = this.users.find(u => u.id === this.selectedUser!.id);
      if (!exists) {
        this.selectedUser = null; // or optionally, keep showing previous user
      }
    }
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  onProfileChange(): void {
    this.applyClientSideFilter();
  }

  onChannelChange(): void {
    this.applyClientSideFilter();
  }

  onStatusChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedProfile = '';
    this.selectedChannel = '';
    this.selectedStatus = '';
    this.applyClientSideFilter();
  }

  viewUserDetails(user: User): void {
    this.selectedUser = { ...user };
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;

    // Reset after a short delay to let Angular close the dialog smoothly
    setTimeout(() => {
      this.selectedUser = null;
    }, 200);
  }


  getProfileClass(profile: string): string {
    const profileMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'super-admin',
      'DASHMASTER': 'dashmaster',
      'ADMIN': 'admin',
      'USER': 'user',
      'MANAGER': 'manager',
    };
    return profileMap[profile] || 'default';
  }

  getProfileIcon(profile: string): string {
    const iconMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'pi-shield',
      'DASHMASTER': 'pi-star',
      'ADMIN': 'pi-user-edit',
      'USER': 'pi-user',
      'MANAGER': 'pi-briefcase',
    };
    return iconMap[profile] || 'pi-user';
  }

  getChannelIcon(channel: string): string {
    const iconMap: { [key: string]: string } = {
      'APP': 'pi-mobile',
      'PORTAL': 'pi-desktop',
      'WEB': 'pi-globe',
    };
    return iconMap[channel] || 'pi-circle';
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getStatusClass(blocked: boolean): string {
    return blocked ? 'inactive' : 'active';
  }

  getStatusIcon(blocked: boolean): string {
    return blocked ? 'pi-ban' : 'pi-check-circle';
  }

  getStatusText(blocked: boolean): string {
    return blocked ? 'Blocked' : 'Active';
  }

  navigateToCreateUser(): void {
    this.router.navigate(['forms/register-user'])
  }

  navigateToUpdateUser(user: User, event?: Event): void {
    event?.stopPropagation();

    if (!user?.id) {
      console.error('User ID missing', user);
      return;
    }

    // console.log('Navigating to update user:', user.id);
    // console.log('User data being passed:', user);

    // Pass the complete user object through router state
    // This ensures the data is immediately available in the update component
    this.router.navigate(['/forms/update-user', user.id], {
      state: {
        user: user,
        // Add timestamp to ensure fresh state
        timestamp: Date.now()
      }
    });
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchUsers(true, this.lastEvent);
    } else {
      this.fetchUsers(true, { first: 0, rows: this.rows });
    }
  }

  deleteUser(user: User): void {
    if (!user?.username) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Data',
        detail: 'User username is missing.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${this.getFullName(user)}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',

      accept: () => {
        const payload = {
          entityId: this.entityId,
          username: user.username
        };

        interface DeleteResponse {
          status: number;
          message: string;
          data: any[];
          totalRecords: number;
        }

        this.loadingStore.start();

        this.dataService
          .post<DeleteResponse>(
            API_ENDPOINTS.DELETE_USER,
            payload,
            'delete-general-user',
            true,
          )
          .subscribe({
            next: (response) => {
              if (response.status === 0) {
                // ✅ Success toast
                this.messageService.add({
                  severity: 'success',
                  summary: 'Deleted',
                  detail: response.message || 'User deleted successfully.'
                });

                // ⚡ Optimistic UI update (remove locally)
                this.allUsers = this.allUsers.filter(
                  u => u.username !== user.username
                );

                this.totalRecords = this.totalRecords - 1;

                // Recalculate stats + filters
                this.calculateStats();
                this.applyClientSideFilter();

                // Close dialog if deleted user was open
                if (this.selectedUser?.username === user.username) {
                  this.closeDetailDialog();
                }

                this.cdr.detectChanges();
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Failed',
                  detail: response.message || 'Delete failed.'
                });
              }
            },
            error: (error) => {
              console.error('Delete error:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'System Error',
                detail: 'Server is unreachable. Try again later.'
              });
            },
            complete: () => this.loadingStore.stop()
          });
      }
    });
  }

  sendResetPinPhone(user: User): void {
    if (!user.phoneNumber) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Data',
        detail: 'User phone number is missing.'
      });
      return;
    }

    const payload = {
      channel: 'PORTAL',
      entityId: this.entityId,
      username: user.phoneNumber
    };

    interface PinResponse {
      status: number,
      message: string,
      data: any[],
      totalRecords: number
    }

    this.dataService.post<PinResponse>(API_ENDPOINTS.SEND_RESET_PASSWORD, payload).subscribe({
      next: (response) => {

        if (response.status === 0) {
          // REAL success
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Reset PIN sent successfully.'
          });
        } else {
          // Business error from backend
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: response.message || 'Request failed.'
          });
        }
      },
      error: (error) => {
        // Network / server crash
        console.error('HTTP Error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'System Error',
          detail: 'Server is unreachable. Try again later.'
        });
      }
    });
  }

  // ----- Shared export helpers -----

  private mapUsersForExport(users: User[]): any[] {
    return users.map(user => ({
      'Full Name': this.getFullName(user),
      'Username': user.username,
      'Email': user.email,
      'Phone Number': user.phoneNumber,
      'ID Number': user.idNumber || 'N/A',
      'Profile': user.profile,
      'Channel': user.channel,
      'Status': this.getStatusText(user.blocked),
      'Login Trials': user.loginTrials,
      'First Login': user.firstLogin ? 'Yes' : 'No',
      'Created On': user.createdOn,
    }));
  }

  private writeExcelFile(rows: any[], fileNamePrefix: string): void {
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Optional: reasonable column widths
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 15 },
      { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${fileNamePrefix}_${timestamp}.xlsx`);
  }

  // ----- Export current (filtered/loaded) users -----

  exportCurrentPageUsers(): void {
    if (!this.filteredUsers.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'There are no users to export.'
      });
      return;
    }

    this.exportingCurrent = true;
    try {
      const rows = this.mapUsersForExport(this.filteredUsers);
      this.writeExcelFile(rows, 'users_current_page');
      this.messageService.add({
        severity: 'success',
        summary: 'Exported',
        detail: `Exported ${rows.length} users.`
      });
    } catch (err) {
      console.error('Export error', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Could not export users.'
      });
    } finally {
      this.exportingCurrent = false;
    }
  }

  // ----- Export ALL users in the system (batched) -----

  exportAllUsers(): void {
    if (this.exportingAll) return;

    this.exportingAll = true;
    const batchSize = 500;
    const collected: User[] = [];

    this.messageService.add({
      severity: 'info',
      summary: 'Export Started',
      detail: 'Fetching all users, this may take a moment…'
    });

    const fetchBatch = (page: number): void => {
      const payload = { entityId: this.entityId, page, size: batchSize };

      this.dataService
        .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, `export-all-${page}`, true)
        .subscribe({
          next: (response) => {
            collected.push(...response.data);
            const totalPages = Math.ceil(response.totalRecords / batchSize);

            if (page + 1 < totalPages) {
              fetchBatch(page + 1);
            } else {
              try {
                const rows = this.mapUsersForExport(collected);
                this.writeExcelFile(rows, 'all_users');
                this.messageService.add({
                  severity: 'success',
                  summary: 'Exported',
                  detail: `Exported ${rows.length} users.`
                });
              } catch (err) {
                console.error('Export error', err);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Export Failed',
                  detail: 'Could not build the export file.'
                });
              } finally {
                this.exportingAll = false;
              }
            }
          },
          error: (err) => {
            console.error('Export all users error', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Export Failed',
              detail: 'Failed to fetch all users for export.'
            });
            this.exportingAll = false;
          }
        });
    };

    fetchBatch(0);
  }
}
