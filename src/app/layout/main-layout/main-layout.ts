// layout/main-layout/main-layout.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../@core/api/data.service';
import { LoadingStore } from '../../../@core/state/loading.store';
import { API_ENDPOINTS } from '../../../@core/api/endpoints';
import { ButtonModule } from 'primeng/button';

interface NavConfig {
  route: string;
  tabs?: TabItem[];
}

interface TabItem {
  label: string;
  icon: string;
  path: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, DialogModule, ButtonModule, ToggleSwitchModule, FormsModule],
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css'],
})
export class MainLayoutComponent implements OnInit {
  loading: any;

  notifications: NotificationItem[] = [
    {
      id: 1,
      title: 'New Parcel Received',
      message: 'Parcel arrived at Westlands office',
      time: '5 mins ago',
      read: false,
    },
    {
      id: 2,
      title: 'Transfer Completed',
      message: 'KES 25,000 sent to driver wallet',
      time: '1 hour ago',
      read: true,
    },
  ];

  unreadCount = 2;

  // UI State
  sidebarCollapsed = false;
  currentRoute = '';
  activeTabIndex = 0;

  // User Info
  userInfo = {
    name: 'Gopay Admin',
    email: 'admin@gopay.ke',
    initials: 'GA',
  };

  // Navigation Configuration - Maps routes to their tab menus
  private navigationConfig: NavConfig[] = [
    {
      route: '/transactions',
      tabs: [
        { label: 'All Transactions', icon: 'pi pi-list', path: '/transactions/all' },
        { label: 'Pending', icon: 'pi pi-clock', path: '/transactions/pending' },
        { label: 'Failed', icon: 'pi pi-times-circle', path: '/transactions/failed' },
      ],
    },
    {
      route: '/transfer-payment',
      tabs: [
        { label: 'Credit Driver', icon: 'pi pi-list', path: '/transfer-payment/1' },
        { label: 'Funds Re-assignment', icon: 'pi pi-clock', path: '/transfer-payment/2' },
      ],
    },
    {
      route: '/vehicle-analysis',
      tabs: [
        { label: 'Daily', icon: 'pi pi-calendar', path: '/vehicle-analysis/daily' },
        { label: 'Weekly', icon: 'pi pi-calendar-plus', path: '/vehicle-analysis/weekly' },
        { label: 'Monthly', icon: 'pi pi-calendar-times', path: '/vehicle-analysis/monthly' },
        { label: 'Yearly', icon: 'pi pi-chart-line', path: '/vehicle-analysis/yearly' },
      ],
    },
    {
      route: '/prediction',
      tabs: [
        { label: 'Short Term', icon: 'pi pi-clock', path: '/prediction/short-term' },
        { label: 'Long Term', icon: 'pi pi-history', path: '/prediction/long-term' },
        { label: 'Trends', icon: 'pi pi-chart-bar', path: '/prediction/trends' },
      ],
    },
    {
      route: '/revenue',
      tabs: [
        { label: 'Overview', icon: 'pi pi-dollar', path: '/revenue/all' },
        { label: 'By Vehicle', icon: 'pi pi-car', path: '/revenue/by-vehicle' },
        { label: 'By Location', icon: 'pi pi-map-marker', path: '/revenue/by-location' },
      ],
    },
    {
      route: '/vehicles',
      tabs: [
        { label: 'All Vehicles', icon: 'pi pi-car', path: '/vehicles/all' },
        { label: 'Active', icon: 'pi pi-check', path: '/vehicles/active' },
        { label: 'Inactive', icon: 'pi pi-ban', path: '/vehicles/inactive' },
        { label: 'Maintenance', icon: 'pi pi-wrench', path: '/vehicles/maintenance' },
      ],
    },
     {
      route: '/driver-assignments',
      tabs: [
        { label: 'Overview', icon: 'pi pi-list', path: '/driver-assignments/all' },
        { label: 'Active', icon: 'pi pi-check', path: '/driver-assignments/active' },
        { label: 'Inactive', icon: 'pi pi-wrench', path: '/driver-assignments/inactive' },
        { label: 'Rejected', icon: 'pi pi-ban', path: '/driver-assignments/rejected' },
        { label: 'Pending', icon: 'pi pi-clock', path: '/driver-assignments/pending' },
      ],
    },
    {
      route: '/drivers',
      tabs: [
        { label: 'All Drivers', icon: 'pi pi-user', path: '/drivers/all' },
        { label: 'Active Drivers', icon: 'pi pi-check', path: '/drivers/active' },
        { label: 'Inactive Drivers', icon: 'pi pi-ban', path: '/drivers/inactive' },
      ],
    },
    {
      route: '/users',
      tabs: [
        { label: 'All Users', icon: 'pi pi-avatar', path: '/users/all' },
        { label: 'All Admins', icon: 'pi pi-avatar', path: '/users/admins' },
        { label: 'All Investors', icon: 'pi pi-avatar', path: '/users/investors' },
        { label: 'All Marshalls', icon: 'pi pi-avatar', path: '/users/marshals' },
        { label: 'All Drivers', icon: 'pi pi-avatar', path: '/users/drivers' },
        { label: 'All Conductors', icon: 'pi pi-avatar', path: '/users/conductors' },
        { label: 'All Passengers', icon: 'pi pi-avatar', path: '/users/customers' },
        { label: 'Deactivated Users', icon: 'pi pi-avatar', path: '/users/inactive' },
      ],
    },
    {
      route: '/locations',
      tabs: [
        { label: 'Stages', icon: 'pi pi-location', path: '/locations/stages' },
        { label: 'Routes', icon: 'pi pi-location', path: '/locations/routes' },
      ],
    },

    {
      route: '/wallet',
      tabs: [
        { label: 'Organization Wallet', icon: 'pi pi-wallet', path: '/wallet/organization' },
        { label: 'User Wallet', icon: 'pi pi-wallet', path: '/wallet/user' },
      ],
    },
    {
      route: '/parcel-offices',
      tabs: [
        { label: 'Parcel Source', icon: 'pi pi-location', path: '/parcel-offices/parcel-source' },
        { label: 'Parcel Destination', icon: 'pi pi-location', path: '/parcel-offices/parcel-destination' },
      ],
    },
  ];

  // Current tabs to display
  currentTabs: TabItem[] = [];
  showTabs = false;
  notificationDialogVisible = false;
  settingsDialogVisible = false;

  // Settings toggles
  darkModeEnabled = false;
  emailNotificationsEnabled = true;
  autoLogoutEnabled = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupRouteListener();
  }

  private setupRouteListener() {
    // Handle initial route
    this.handleRouteChange(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleRouteChange(event.urlAfterRedirects);
      });
  }

  private handleRouteChange(url: string) {
    this.currentRoute = url.split('?')[0];

    // Find matching navigation config
    const config = this.navigationConfig.find((nav) => this.currentRoute.startsWith(nav.route));

    if (config && config.tabs) {
      this.currentTabs = config.tabs;
      this.showTabs = true;
      this.updateActiveTab();
    } else {
      this.currentTabs = [];
      this.showTabs = false;
    }
  }

  private updateActiveTab() {
    const index = this.currentTabs.findIndex(
      (tab) => this.currentRoute === tab.path || this.currentRoute.startsWith(tab.path + '/')
    );
    this.activeTabIndex = index !== -1 ? index : 0;
  }

  navigate(route: string) {
    this.router.navigate([route]);

    if (this.isMobile()) {
      this.sidebarCollapsed = true;
    }
  }

  onTabChange(index: number) {
    const selectedTab = this.currentTabs[index];
    if (selectedTab) {
      this.activeTabIndex = index;
      this.router.navigate([selectedTab.path]);
    }
  }

  isMobile(): boolean {
    return window.innerWidth <= 1024;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleSidebarMobile() {
    this.sidebarCollapsed = true;
  }

  isRouteActive(route: string, exact: boolean = false): boolean {
    if (exact) {
      return this.currentRoute === route;
    }
    return this.currentRoute.startsWith(route);
  }

  loadNotifications() {
    this.dataService.get<NotificationItem[]>(API_ENDPOINTS.ALL_NOTIFICATIONS).subscribe((data) => {
      this.notifications = data;
      this.unreadCount = data.filter((n) => !n.read).length;
    });
  }

  showNotifications() {
    this.notificationDialogVisible = true;
  }

  hideNotifications() {
    this.notificationDialogVisible = false;
  }

  showSettings() {
    this.settingsDialogVisible = true;
  }

  hideSettings() {
    this.settingsDialogVisible = false;
  }

  logout() {
    console.log('Logging out...');
    // Implement logout logic here
    this.router.navigate(['/login']);
  }
}
