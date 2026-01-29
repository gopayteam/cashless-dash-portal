// pages/users/all-users.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { User } from '../../../../@core/models/user/user.model';
import { UserApiResponse } from '../../../../@core/models/user/user_api_Response.mode';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

interface ProfileOption {
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
  selector: 'app-all-investors-users',
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
  ],
  templateUrl: './investors.html',
  styleUrls: [
    './investors.css',
    '../../../../styles/modules/_cards.css',
    '../../../../styles/modules/_user_module.css'
  ],
})
export class InvestorsComponent implements OnInit {
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

  // Filter options
  profileOptions: ProfileOption[] = [
    { label: 'All Profiles', value: '' },
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Dashmaster', value: 'DASHMASTER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
    { label: 'Manager', value: 'MANAGER' },
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

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
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
    const event = $event;

    // Handle pagination from PrimeNG lazy load event
    let page = 0;
    let pageSize = this.rows;

    if (event) {
      page = event.first / event.rows;
      pageSize = event.rows;
      this.first = event.first;
      this.rows = event.rows;
    }

    const payload = {
      entityId: this.entityId,
      agent: "INVESTOR",
      page,
      size: pageSize,
    };

    this.loadingStore.start();

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'investor-users')
      .subscribe({
        next: (response) => {
          this.allUsers = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.loadingStore.stop();
        },
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
    this.selectedUser = user;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedUser = null;
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

  navigateToCreateInvestor(): void {
    this.router.navigate(['forms/register-investor'])
  }

  navigateToUpdateInvestor(investor: User): void {
    console.log('Navigating to:', investor.id);

    if (!investor?.id) {
      console.error('Investor ID missing', investor);
      return;
    }

    this.router.navigate(['/forms/update-investor', investor.id], {
      state: { investor }
    });
  }

  refresh(): void {
    this.loadUsers({ first: this.first, rows: this.rows });
  }
}
