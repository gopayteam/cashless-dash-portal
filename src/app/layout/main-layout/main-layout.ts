// layout/main-layout/main-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavConfig {
  route: string;
  tabs?: TabItem[];
}

interface TabItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css'],
})
export class MainLayoutComponent implements OnInit {
  loading: any;

  // UI State
  sidebarCollapsed = false;
  currentRoute = '';
  activeTabIndex = 0;

  // User Info
  userInfo = {
    name: 'SuperMetro Admin',
    email: 'super.metro@gmail.com',
    initials: 'SA',
  };

  // Navigation Configuration - Maps routes to their tab menus
  private navigationConfig: NavConfig[] = [
    {
      route: '/dashboard',
      tabs: [
        { label: 'Overview', icon: 'pi pi-th-large', path: '/dashboard/home' },
        { label: 'Statistics', icon: 'pi pi-chart-pie', path: '/dashboard/stats' },
        { label: 'Reports', icon: 'pi pi-file', path: '/dashboard/reports' },
      ],
    },

    {
      route: '/transactions',
      tabs: [
        { label: 'All Transactions', icon: 'pi pi-list', path: '/transactions/all' },
        { label: 'Pending', icon: 'pi pi-clock', path: '/transactions/pending' },
        { label: 'Completed', icon: 'pi pi-check-circle', path: '/transactions/completed' },
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
        { label: 'All Vehicles', icon: 'pi pi-car', path: 'vehicles/all' },
        { label: 'Active', icon: 'pi pi-check', path: '/vehicles/active' },
        { label: 'Inactive', icon: 'pi pi-ban', path: '/vehicles/inactive' },
        { label: 'Maintenance', icon: 'pi pi-wrench', path: '/vehicles/maintenance' },
      ],
    },

    {
      route: '/users',
      tabs: [
        { label: 'All Users', icon: 'pi pi-avatar', path: '/users/all' },
        { label: 'All Admins', icon: 'pi pi-avatar', path: '/users/admins' },
        { label: 'All Marshalls', icon: 'pi pi-avatar', path: '/users/marshals' },
        { label: 'All Drivers', icon: 'pi pi-avatar', path: '/users/drivers' },
        { label: 'All Conductors', icon: 'pi pi-avatar', path: '/users/conductors' },
        { label: 'All Passengers', icon: 'pi pi-avatar', path: '/users/customers' },
        { label: 'Deactivated Users', icon: 'pi pi-avatar', path: '/users/inactive' },
      ],
    },

    {
      route: '/locations',
      tabs: [{ label: 'Locations', icon: 'pi pi-location', path: '/locations' }],
    },
  ];

  // Current tabs to display
  currentTabs: TabItem[] = [];
  showTabs = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.setupRouteListener();
  }

  private setupRouteListener() {
    // Handle initial route
    this.handleRouteChange(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
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
  }

  onTabChange(index: number) {
    const selectedTab = this.currentTabs[index];
    if (selectedTab) {
      this.activeTabIndex = index;
      this.router.navigate([selectedTab.path]);
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  isRouteActive(route: string, exact: boolean = false): boolean {
    if (exact) {
      return this.currentRoute === route;
    }
    return this.currentRoute.startsWith(route);
  }

  logout() {
    console.log('Logging out...');
    // Implement logout logic here
    this.router.navigate(['/login']);
  }
}
