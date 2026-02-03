import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../@core/services/auth.service';
import { HasRoleDirective } from '../../../@core/directives/has-role.directive';
import { Dialog } from "primeng/dialog";
import { ToggleSwitchModule } from 'primeng/toggleswitch';

interface TabConfig {
  label: string;
  icon: string;
  route: string;
  roles?: string[]; // Required roles to view this tab
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HasRoleDirective,
    RouterOutlet,
    Dialog,
    ReactiveFormsModule,
    ToggleSwitchModule,
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit {

  // Sidebar state
  sidebarCollapsed = false;
  sidebarVisible = false;

  // User info
  userInfo = {
    name: '',
    email: '',
    initials: ''
  };

  // Notifications
  notificationDialogVisible = false;
  notifications: Notification[] = [];
  unreadCount = 0;

  // Settings
  settingsDialogVisible = false;
  darkModeEnabled = false;
  emailNotificationsEnabled = true;
  autoLogoutEnabled = false;

  // Tab navigation
  showTabs = false;
  currentTabs: TabConfig[] = [];
  filteredTabs: TabConfig[] = [];
  activeTabIndex = 0;

  private fb = inject(FormBuilder);

  settingsForm!: FormGroup;

  private initializeSettingsForm() {
    this.settingsForm = this.fb.group({
      darkMode: [false],
      emailNotifications: [true],
      autoLogout: [false]
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  /* =============================================
     TAB CONFIGURATION BY ROUTE
  ============================================= */
  private tabConfigs: { [key: string]: TabConfig[] } = {
    // '/dashboard': [
    //   { label: 'Overview', icon: 'pi pi-home', route: '/dashboard/home', roles: ['CAN_VIEW_DASHBOARD'] },
    //   { label: 'Statistics', icon: 'pi pi-chart-bar', route: '/dashboard/stats', roles: ['CAN_VIEW_DASHBOARD'] },
    //   { label: 'Reports', icon: 'pi pi-file', route: '/dashboard/reports', roles: ['CAN_VIEW_DASHBOARD'] }
    // ],

    '/transactions': [
      { label: 'All Transactions', icon: 'pi pi-list', route: '/transactions/all', roles: ['CAN_VIEW_TRANSACTIONS'] },
      { label: 'Failed', icon: 'pi pi-times-circle', route: '/transactions/failed', roles: ['CAN_VIEW_TRANSACTIONS'] },
      { label: 'Pending', icon: 'pi pi-clock', route: '/transactions/pending', roles: ['CAN_VIEW_TRANSACTIONS'] }
    ],

    '/transfer-payment': [
      { label: 'Credit Driver', icon: 'pi pi-list', route: '/transfer-payment/1' },
      { label: 'Funds Re-assignment', icon: 'pi pi-clock', route: '/transfer-payment/2' },
    ],

    // '/vehicles': [
    //   { label: 'All Vehicles', icon: 'pi pi-car', route: '/vehicles/all', roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] },
    //   { label: 'Active', icon: 'pi pi-check-circle', route: '/vehicles/active', roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] },
    //   { label: 'Inactive', icon: 'pi pi-ban', route: '/vehicles/inactive', roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] },
    //   { label: 'Maintenance', icon: 'pi pi-wrench', route: '/vehicles/maintenance', roles: ['CAN_VIEW_VEHICLES', 'CAN_EDIT_VEHICLE'] }
    // ],

    '/drivers': [
      { label: 'All Drivers', icon: 'pi pi-users', route: '/drivers/all', roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] },
      { label: 'Active', icon: 'pi pi-check-circle', route: '/drivers/active', roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] },
      { label: 'Inactive', icon: 'pi pi-ban', route: '/drivers/inactive', roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] }
    ],
    '/driver-assignments': [
      { label: 'All Assignments', icon: 'pi pi-list', route: '/driver-assignments/all', roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] },
      { label: 'Active', icon: 'pi pi-check-circle', route: '/driver-assignments/active', roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] },
      { label: 'Inactive', icon: 'pi pi-ban', route: '/driver-assignments/inactive', roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] },
      { label: 'Pending', icon: 'pi pi-clock', route: '/driver-assignments/pending', roles: ['CAN_VIEW_DRIVER_FLEET_REQUEST', 'CAN_APPROVE_DRIVER_FLEET'] },
      { label: 'Rejected', icon: 'pi pi-times-circle', route: '/driver-assignments/rejected', roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_REJECT_DRIVER'] }
    ],

    // '/parcels': [
    //   { label: 'All Parcels', icon: 'pi pi-box', route: '/parcels/all', roles: ['CAN_MANAGE_PARCELS'] }
    // ],

    '/parcel-offices': [
      { label: 'Source', icon: 'pi pi-building', route: '/parcel-offices/parcel-source', roles: ['CAN_MANAGE_PARCELS'] },
      { label: 'Destination', icon: 'pi pi-map-marker', route: '/parcel-offices/parcel-destination', roles: ['CAN_MANAGE_PARCELS'] }
    ],

    '/locations': [
      { label: 'Stages', icon: 'pi pi-map', route: '/locations/stages', roles: ['CAN_VIEW_STAGES', 'CAN_VIEW_LOCATIONS'] },
      { label: 'Routes', icon: 'pi pi-directions', route: '/locations/routes', roles: ['CAN_VIEW_ROUTES', 'CAN_VIEW_LOCATIONS'] }
    ],

    '/wallet': [
      { label: 'Organization', icon: 'pi pi-building', route: '/wallet/organization', roles: ['CAN_MANAGE_ORGANIZATION_WALLETS', 'CAN_MANAGE_ORG_WALLETS'] },
      { label: 'User Wallets', icon: 'pi pi-users', route: '/wallet/user', roles: ['CAN_VIEW'] }
    ],

    '/users': [
      { label: 'All Users', icon: 'pi pi-users', route: '/users/all', roles: ['CAN_VIEW_USERS', 'CAN_VIEW_USER'] },
      { label: 'Admins', icon: 'pi pi-shield', route: '/users/admins', roles: ['CAN_VIEW_ADMINS'] },
      { label: 'Drivers', icon: 'pi pi-user', route: '/users/super-drivers', roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] },
      { label: 'Conductors', icon: 'pi pi-user', route: '/users/conductors', roles: ['CAN_VIEW_TOUTS'] },
      { label: 'Passengers', icon: 'pi pi-shopping-cart', route: '/users/passengers', roles: ['CAN_VIEW_CUSTOMERS', 'CAN_VIEW_PASSENGERS'] },
      { label: 'Investors', icon: 'pi pi-money-bill', route: '/users/investors', roles: ['CAN_VIEW_INVESTORS', 'CAN_VIEW_INVESTOR'] },
      { label: 'Marshalls', icon: 'pi pi-user', route: '/users/marshals', roles: ['CAN_VIEW_USERS'] },
      { label: 'Parcel Managers', icon: 'pi pi-user', route: '/users/parcel-managers', roles: ['CAN_VIEW_USERS'] },
      { label: 'Deactivated', icon: 'pi pi-ban', route: '/users/deactivated', roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] }
    ],

    '/audits': [
      { label: 'System Audits', icon: 'pi pi-server', route: '/audits/all', roles: ['CAN_VIEW_ADMINS', 'CAN_VIEW_DASHBOARD'] },
      { label: 'User Audits', icon: 'pi pi-users', route: '/audits/user', roles: ['CAN_VIEW_USERS', 'CAN_VIEW_ADMINS'] }
    ],

    '/revenue': [
      { label: 'All Revenue', icon: 'pi pi-chart-line', route: '/revenue/all', roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_DASHBOARD'] },
      { label: 'By Vehicle', icon: 'pi pi-car', route: '/revenue/by-vehicle', roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_VEHICLES'] },
      { label: 'By Location', icon: 'pi pi-map-marker', route: '/revenue/by-location', roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_LOCATIONS'] }
    ],

    '/vehicle-analysis': [
      { label: 'Daily', icon: 'pi pi-calendar', route: '/vehicle-analysis/daily', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] },
      { label: 'Weekly', icon: 'pi pi-calendar-plus', route: '/vehicle-analysis/weekly', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] },
      { label: 'Monthly', icon: 'pi pi-calendar-times', route: '/vehicle-analysis/monthly', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] },
      { label: 'Yearly', icon: 'pi pi-chart-bar', route: '/vehicle-analysis/yearly', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] }
    ],

    '/prediction': [
      { label: 'Short Term', icon: 'pi pi-calendar', route: '/prediction/short-term', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] },
      { label: 'Long Term', icon: 'pi pi-chart-line', route: '/prediction/long-term', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] },
      { label: 'Trends', icon: 'pi pi-chart-bar', route: '/prediction/trends', roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] }
    ]
  };

  ngOnInit() {
    this.loadUserInfo();
    this.setupRouteListener();
    this.loadNotifications();
    this.initializeSettingsForm();
  }

  /* =============================================
     USER INFO
  ============================================= */
  private loadUserInfo() {
    const user = this.authService.currentUser();
    if (user) {
      this.userInfo = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        initials: this.getInitials(user.firstName, user.lastName)
      };
    }
  }

  private getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /* =============================================
     ROLE-BASED ACCESS HELPERS
  ============================================= */
  hasTransactionAccess(): boolean {
    return this.authService.hasAnyRole(['CAN_VIEW_TRANSACTIONS', 'CAN_ADD', 'CAN_EDIT']);
  }

  hasParcelAccess(): boolean {
    return this.authService.hasAnyRole(['CAN_MANAGE_PARCELS', 'CAN_DELETE']);
  }

  hasVehicleOrDriverAccess(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_VEHICLES',
      'CAN_VIEW_VEHICLE',
      'CAN_VIEW_DRIVERS',
      'CAN_VIEW_DRIVER',
      'CAN_VIEW_DRIVER_FLEET_REQUESTS',
      'CAN_VIEW_DRIVER_FLEET'
    ]);
  }

  hasFinanceAccess(): boolean {
    return this.authService.hasAnyRole([
      'CAN_MANAGE_ORGANIZATION_WALLETS',
      'CAN_MANAGE_ORG_WALLETS',
      'CAN_VIEW_TRANSACTIONS'
    ]);
  }

  hasUserManagementAccess(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_USERS',
      'CAN_VIEW_USER',
      'CAN_VIEW_ADMINS',
      'CAN_VIEW_DRIVERS',
      'CAN_VIEW_CUSTOMERS',
      'CAN_VIEW_INVESTORS'
    ]);
  }

  hasAuditAccess(): boolean {
    return this.authService.hasAnyRole(['CAN_VIEW_ADMINS', 'CAN_VIEW_DASHBOARD', 'CAN_VIEW_USERS']);
  }

  /* =============================================
     TAB NAVIGATION WITH ROLE FILTERING
  ============================================= */
  private setupRouteListener() {
    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateTabsForCurrentRoute(event.url);
      });

    // Set tabs for initial route
    this.updateTabsForCurrentRoute(this.router.url);
  }

  private updateTabsForCurrentRoute(url: string) {
    // Extract the base path (first two segments)
    const pathSegments = url.split('/').filter(seg => seg);
    const basePath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '';

    // Find exact match for base path
    const routeKey = Object.keys(this.tabConfigs).find(key => basePath === key);

    if (routeKey) {
      this.currentTabs = this.tabConfigs[routeKey];
      this.filteredTabs = this.filterTabsByRole(this.currentTabs);
      this.showTabs = this.filteredTabs.length > 0;
      this.updateActiveTab(url);
    } else {
      this.showTabs = false;
      this.currentTabs = [];
      this.filteredTabs = [];
    }
  }

  private filterTabsByRole(tabs: TabConfig[]): TabConfig[] {
    return tabs.filter(tab => {
      // If no roles specified, show tab
      if (!tab.roles || tab.roles.length === 0) {
        return true;
      }
      // Check if user has any of the required roles
      return this.authService.hasAnyRole(tab.roles);
    });
  }

  private updateActiveTab(url: string) {
    const index = this.filteredTabs.findIndex(tab => url.includes(tab.route));
    this.activeTabIndex = index >= 0 ? index : 0;
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    const tab = this.filteredTabs[index];
    if (tab) {
      this.router.navigate([tab.route]);
    }
  }

  /* =============================================
     SIDEBAR & NAVIGATION
  ============================================= */
  toggleSidebar() {
    if (this.isMobile()) {
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileSidebar() {
    this.sidebarVisible = false;
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;  // Changed < to <= for consistency
  }

  // Add this to handle window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Close mobile sidebar if window is resized to desktop
    if (!this.isMobile() && this.sidebarVisible) {
      this.sidebarVisible = false;
    }
    // Expand sidebar if window is resized to desktop while collapsed
    if (!this.isMobile() && this.sidebarCollapsed) {
      this.sidebarCollapsed = false;
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigate(route: string) {
    this.router.navigate([route]);
    if (this.isMobile()) {
      this.closeMobileSidebar();
    }
  }

  /* =============================================
     NOTIFICATIONS
  ============================================= */
  private loadNotifications() {
    // Mock notifications - replace with actual service call
    // this.notifications = [
    //   {
    //     id: '1',
    //     title: 'New Driver Approved',
    //     message: 'Driver John Doe has been approved',
    //     time: '2 minutes ago',
    //     type: 'success',
    //     read: false
    //   },
    //   {
    //     id: '2',
    //     title: 'Vehicle Maintenance Due',
    //     message: 'KBX 123A requires maintenance',
    //     time: '1 hour ago',
    //     type: 'warning',
    //     read: false
    //   }
    // ];
    this.notifications = []
    this.updateUnreadCount();
  }

  showNotifications() {
    this.notificationDialogVisible = true;
  }

  hideNotifications() {
    this.notificationDialogVisible = false;
  }

  markAsRead(notification: Notification) {
    notification.read = true;
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      error: 'pi pi-times-circle'
    };
    return icons[type] || 'pi pi-info-circle';
  }

  navigateToNotifications() {
    this.notificationDialogVisible = false;
    this.router.navigate(['/dashboard/notifications']);
  }

  /* =============================================
     SETTINGS
  ============================================= */
  showSettings() {
    this.settingsDialogVisible = true;
  }

  navigateToProfile() {
    this.settingsDialogVisible = false;
    this.router.navigate(['/dashboard/profile']);
  }

  navigateToSettings() {
    this.settingsDialogVisible = false;
    this.router.navigate(['/dashboard/settings']);
  }

  /* =============================================
     LOGOUT
  ============================================= */
  logout() {
    this.authService.signOut();
  }


  /* =============================================
   SECTION VISIBILITY HELPERS
  ============================================= */
  hasAnyItemInSection(items: string[]): boolean {
    return items.some(role => this.authService.hasRole(role));
  }

  // Check if user can see any transaction items
  showTransactionsSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_TRANSACTIONS',
      'CAN_ADD',
      'CAN_EDIT'
    ]);
  }

  // Check if user can see any parcel items
  showParcelsSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_MANAGE_PARCELS',
      'CAN_DELETE'
    ]);
  }

  // Check if user can see any vehicle/operations items
  showVehiclesSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_VEHICLES',
      'CAN_VIEW_VEHICLE',
      'CAN_VIEW_DRIVERS',
      'CAN_VIEW_DRIVER',
      'CAN_VIEW_DRIVER_FLEET_REQUESTS',
      'CAN_VIEW_DRIVER_FLEET',
      'CAN_VIEW_STAGES',
      'CAN_VIEW_ROUTES',
      'CAN_VIEW_LOCATIONS'
    ]);
  }

  // Check if user can see any finance items
  showFinanceSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_MANAGE_ORGANIZATION_WALLETS',
      'CAN_MANAGE_ORG_WALLETS',
      'CAN_VIEW_TRANSACTIONS'
    ]);
  }

  // Check if user can see any user management items
  showUserManagementSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_USERS',
      'CAN_VIEW_USER'
    ]);
  }

  // Check if user can see any audit items
  showAuditsSection(): boolean {
    return this.authService.hasAnyRole([
      'CAN_VIEW_ADMINS',
      'CAN_VIEW_DASHBOARD'
    ]);
  }
}
