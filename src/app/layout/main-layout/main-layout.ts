import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../@core/services/auth.service';
import { HasRoleDirective } from '../../../@core/directives/has-role.directive';
import { Dialog } from "primeng/dialog";
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Subscription } from 'rxjs';
import { DarkModeService } from '../../../@core/services/dark-mode.service';

interface TabConfig {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
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
export class MainLayoutComponent implements OnInit, OnDestroy {

  // Sidebar state
  sidebarCollapsed = false;
  sidebarVisible = false;
  private currentScreenWidth = window.innerWidth;

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

  private darkModeSubscription?: Subscription;

  // Tab navigation
  showTabs = false;
  currentTabs: TabConfig[] = [];
  filteredTabs: TabConfig[] = [];
  activeTabIndex = 0;

  private fb = inject(FormBuilder);
  settingsForm!: FormGroup;

  private tabConfigs: { [key: string]: TabConfig[] } = {
    '/transactions': [
      { label: 'All Transactions', icon: 'pi pi-list', route: '/transactions/all', roles: ['CAN_VIEW_TRANSACTIONS'] },
      { label: 'Failed', icon: 'pi pi-times-circle', route: '/transactions/failed', roles: ['CAN_VIEW_TRANSACTIONS'] },
      { label: 'Pending', icon: 'pi pi-clock', route: '/transactions/pending', roles: ['CAN_VIEW_TRANSACTIONS'] }
    ],
    '/transfer-payment': [
      { label: 'Credit Driver', icon: 'pi pi-list', route: '/transfer-payment/1' },
      { label: 'Funds Re-assignment', icon: 'pi pi-clock', route: '/transfer-payment/2' },
    ],
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
      { label: 'Drivers', icon: 'pi pi-car', route: '/users/super-drivers', roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] },
      { label: 'Conductors', icon: 'pi pi-ticket', route: '/users/conductors', roles: ['CAN_VIEW_TOUTS'] },
      { label: 'Passengers', icon: 'pi pi-users', route: '/users/passengers', roles: ['CAN_VIEW_CUSTOMERS', 'CAN_VIEW_PASSENGERS'] },
      { label: 'Investors', icon: 'pi pi-wallet', route: '/users/investors', roles: ['CAN_VIEW_INVESTORS', 'CAN_VIEW_INVESTOR'] },
      { label: 'Marshalls', icon: 'pi pi-flag', route: '/users/marshals', roles: ['CAN_VIEW_USERS'] },
      { label: 'Parcel Managers', icon: 'pi pi-box', route: '/users/parcel-managers', roles: ['CAN_VIEW_USERS'] },
      { label: 'Deactivated', icon: 'pi pi-user-minus', route: '/users/deactivated', roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] },
      { label: 'Dashmasters', icon: 'pi pi-cog', route: '/users/dashmasters', roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] },
      { label: 'Approvers', icon: 'pi pi-check-circle', route: '/users/approvers', roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] },
      { label: 'Inspectors', icon: 'pi pi-search', route: '/users/inspectors', roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] },
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private darkModeService: DarkModeService
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.setupRouteListener();
    this.loadNotifications();
    this.initializeSettingsForm();
    this.initializeSidebarState();

    // Subscribe to dark mode changes
    this.darkModeSubscription = this.darkModeService.darkMode$.subscribe(
      isDark => {
        this.darkModeEnabled = isDark;
      }
    );

    // Initialize from service
    this.darkModeEnabled = this.darkModeService.isDarkMode;
  }

  ngOnDestroy(): void {
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }

  /**
   * Initialize sidebar state based on screen size and saved preferences
   */
  private initializeSidebarState(): void {
    const savedState = localStorage.getItem('sidebarCollapsed');

    if (this.isMobile()) {
      // Mobile: always start hidden
      this.sidebarVisible = false;
      this.sidebarCollapsed = false;
    } else {
      // Desktop: restore saved state or default to expanded
      this.sidebarCollapsed = savedState === 'true';
      this.sidebarVisible = false; // Not used on desktop
    }
  }

  /**
   * Initialize settings form
   */
  private initializeSettingsForm(): void {
    this.settingsForm = this.fb.group({
      darkMode: [false],
      emailNotifications: [true],
      autoLogout: [false]
    });
  }

  /**
   * Handle dark mode toggle change
   */
  onDarkModeChange(enabled: boolean): void {
    this.darkModeService.setDarkMode(false);
    console.log('Dark mode:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Handle email notifications toggle change
   */
  onEmailNotificationsChange(enabled: boolean): void {
    localStorage.setItem('emailNotificationsEnabled', enabled.toString());
    console.log('Email notifications:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Handle auto logout toggle change
   */
  onAutoLogoutChange(enabled: boolean): void {
    localStorage.setItem('autoLogoutEnabled', enabled.toString());
    console.log('Auto logout:', enabled ? 'enabled' : 'disabled');
  }

  /* =============================================
     USER INFO
  ============================================= */
  private loadUserInfo(): void {
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
     TAB NAVIGATION
  ============================================= */
  private setupRouteListener(): void {
    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateTabsForCurrentRoute(event.url);
        // Auto-close mobile sidebar on navigation
        if (this.isMobile() && this.sidebarVisible) {
          this.closeMobileSidebar();
        }
      });

    this.updateTabsForCurrentRoute(this.router.url);
  }

  private updateTabsForCurrentRoute(url: string): void {
    const pathSegments = url.split('/').filter(seg => seg);
    const basePath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '';

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
      if (!tab.roles || tab.roles.length === 0) {
        return true;
      }
      return this.authService.hasAnyRole(tab.roles);
    });
  }

  private updateActiveTab(url: string): void {
    const index = this.filteredTabs.findIndex(tab => url.includes(tab.route));
    this.activeTabIndex = index >= 0 ? index : 0;
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const tab = this.filteredTabs[index];
    if (tab) {
      this.router.navigate([tab.route]);
    }
  }

  /* =============================================
     SIDEBAR & NAVIGATION - IMPROVED
  ============================================= */
  toggleSidebar(): void {
    if (this.isMobile()) {
      // Mobile: toggle visibility (overlay mode)
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      // Desktop: toggle collapse (push mode)
      this.sidebarCollapsed = !this.sidebarCollapsed;
      // Save preference
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.sidebarVisible = false;
    }
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Handle window resize with debouncing
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    const newWidth = window.innerWidth;
    const wasDesktop = this.currentScreenWidth > 768;
    const isDesktop = newWidth > 768;

    // Only act on mode changes (mobile <-> desktop)
    if (wasDesktop !== isDesktop) {
      if (isDesktop) {
        // Switched to desktop
        this.sidebarVisible = false; // Close mobile overlay
        // Restore saved collapse state
        const savedState = localStorage.getItem('sidebarCollapsed');
        this.sidebarCollapsed = savedState === 'true';
      } else {
        // Switched to mobile
        this.sidebarVisible = false; // Start hidden
        this.sidebarCollapsed = false; // Reset collapse state
      }
    }

    this.currentScreenWidth = newWidth;
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    // Auto-close on mobile after navigation
    if (this.isMobile()) {
      this.closeMobileSidebar();
    }
  }

  /* =============================================
     NOTIFICATIONS
  ============================================= */
  private loadNotifications(): void {
    this.notifications = [];
    this.updateUnreadCount();
  }

  showNotifications(): void {
    this.notificationDialogVisible = true;
  }

  hideNotifications(): void {
    this.notificationDialogVisible = false;
  }

  markAsRead(notification: Notification): void {
    notification.read = true;
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
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

  navigateToNotifications(): void {
    this.notificationDialogVisible = false;
    this.router.navigate(['/dashboard/notifications']);
  }

  /* =============================================
     SETTINGS
  ============================================= */
  showSettings(): void {
    this.settingsDialogVisible = true;
  }

  navigateToProfile(): void {
    this.settingsDialogVisible = false;
    this.router.navigate(['/dashboard/profile']);
  }

  navigateToSettings(): void {
    this.settingsDialogVisible = false;
    this.router.navigate(['/dashboard/settings']);
  }

  /* =============================================
     LOGOUT
  ============================================= */
  logout(): void {
    this.authService.signOut();
  }
}
