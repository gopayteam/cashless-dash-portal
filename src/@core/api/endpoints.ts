export const API_ENDPOINTS = {
  // #####################  AUTHENTICATION SUB-ENDPOINTS   #######################
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh-token',
  REFRESH_TOKEN: '',
  REGISTER: '',

  // #####################  DASHBOARD SUB-ENDPOINTS   #######################
  ALL_PAYMENTS: '/api/payment/passenger/manifest',
  TRANSACTION_STATS: '/api/payment/transactions/stats',
  STATS_BY_PERIOD: '/api/payment/transactions/stats-by-period',
  STATS_PER_CATEGORY: '/api/payment/transactions/stats-per-category',

  // #####################  PARCELS SUB-ENDPOINTS   #######################
  ALL_PARCELS: '/api/parcels/filter/user/sales',
  ALL_PARCEL_MANAGERS: '/api/parcels/filter/user/aggregates',
  ALL_PARCEL_SOURCES: '/api/parcels/report/summary/source',
  ALL_PARCEL_DESTINATIONS: '/api/parcels/report/summary/destination',

  // #####################  Driver SUB-ENDPOINTS   #######################
  ALL_DRIVERS: '/api/v1/org/view-activated-fleets',

  // #####################  LOCATION SUB-ENDPOINTS   #######################
  ALL_STAGES: '/api/route/view/stages',
  ALL_ROUTES: '/api/route/list/routes',

  // #####################  NOTIFICATION SUB-ENDPOINTS   #######################
  ALL_NOTIFICATIONS: '/api/notifications',

  // #####################  WALLET SUB-ENDPOINTS   #######################
  ALL_WALLETS: '/api/payment/wallets/all',
  ALL_ORGANIZATION_WALLETS: '/api/payment/wallets/accounts',

  // #####################  VEHICLE SUB-ENDPOINTS   #######################
  ALL_VEHICLES: '/api/v1/org/vehicles/view-all',

  // #####################  DRIVER-ASSIGNMENTS SUB-ENDPOINTS   #######################
  ALL_DRIVER_ASSIGNMENTS: '/api/v1/org/view-activated-fleets',
  ALL_ACTIVE_DRIVERS: '/api/v1/org/view-activated-fleets',
  ALL_PENDING_REQUESTS: '/api/v1/org/driver/fleets/view',

  // #####################  STATEMENTS SUB-ENDPOINTS   #######################
  WITHDRAWAL_STATEMENTS: '/api/statements/retrieve',

  // #####################  USER SUB-ENDPOINTS   #######################
  ALL_USERS: '/api/v1/org/users/view',
  ALL_DEACTIVATED_USERS: '/api/v1/org/users/view-deactivated',

  // #####################  AUDIT SUB-ENDPOINTS   #######################
  ALL_AUDIT_TRAILS: '/api/v1/org/view-audit-trails',

};
