export const API_ENDPOINTS = {
  // #####################  AUTHENTICATION SUB-ENDPOINTS   #######################
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh-token',
  REFRESH_TOKEN: '',
  // REGISTER: '/api/v1/auth/register',
  REGISTER_USER: '/api/v1/auth/register',
  UPDATE_USER: '/api/v1/org/users/update',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',

  SEND_RESET_PASSWORD: '/api/v1/auth/forgot-password',
  RBAC_ROLES: '/api/v1/org/rbac/profiles/view',

  // #####################  DASHBOARD SUB-ENDPOINTS   #######################
  ALL_PAYMENTS: '/api/payment/passenger/manifest',
  TRANSACTION_STATS: '/api/payment/transactions/stats',
  STATS_BY_PERIOD: '/api/payment/transactions/stats-by-period',
  STATS_PER_CATEGORY: '/api/payment/transactions/stats-per-category',

  // #####################  PARCELS SUB-ENDPOINTS   #######################
  ALL_PARCELS: '/api/parcels/filter/user/sales',
  ALL_DELETED_PARCELS: '/api/parcels/find/deleted/parcels',
  ALL_PARCEL_MANAGERS: '/api/parcels/filter/user/aggregates',
  ALL_PARCEL_SOURCES: '/api/parcels/report/summary/source',
  ALL_PARCEL_DESTINATIONS: '/api/parcels/report/summary/destination',
  ALL_PARCEL_STAGES: '/api/route/list/stages',

  // #####################  Driver SUB-ENDPOINTS   #######################
  ALL_DRIVERS: '/api/v1/org/view-activated-fleets',

  // #####################  LOCATION SUB-ENDPOINTS   #######################
  ALL_STAGES: '/api/route/view/stages',
  ALL_ROUTES: '/api/route/list/routes',

  // #####################  NOTIFICATION SUB-ENDPOINTS   #######################
  ALL_NOTIFICATIONS: '/api/notifications',
  SEND_NOTIFICATIONS: '/api/v1/org/notification/send',
  SEND_BROADCAST: '/api/v1/org/notification/send',

  // #####################  WALLET SUB-ENDPOINTS   #######################
  ALL_WALLETS: '/api/payment/wallets/all',
  ALL_ORGANIZATION_WALLETS: '/api/payment/wallets/accounts',

  // #####################  VEHICLE SUB-ENDPOINTS   #######################
  ALL_VEHICLES: '/api/v1/org/vehicles/view-all',
  VEHICLE_DATA: '/api/v1/org/vehicles/view/fleet',
  VEHICLE_FEES: '/api/v1/org/vehicles/fleet-fees',

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

  // #####################  FORMS SUB-ENDPOINTS   #######################
  CREATE_VEHICLE: '/api/v1/org/vehicles/add',
  CREATE_PARCEL_MANAGER: '/api/v1/auth/register',
  UPDATE_PARCEL_MANAGER: '/api/v1/org/users/update',
  UPDATE_VEHICLE: '/api/v1/org/vehicles/update',

  // #####################  INITIATE TRANSFER SUB-ENDPOINTS   #######################
  CREDIT_DRIVER: '/api/payment/wallets/assign/driver',
  INITIATE_REASSIGNMENT: '/api/payment/wallets/initiate/reassignment',
  CONFIRM_REASSIGNMENT: '/api/payment/wallets/reassign/funds',

  // #####################  FORMS-extra SUB-ENDPOINTS   #######################
  ENTITY_STAGES: '/api/route/view/entity-stages',
  FIND_PARCEL_BY_NUMBER: '/api/parcels/find/parcel-number',
  RETRIEVE_STATEMENTS: '/api/statements/retrieve',

  ACTIVATE_DRIVER_ASSIGNMENT: '/api/v1/org/driver/fleets/approve',
  DEACTIVATE_DRIVER_ASSIGNMENT: '/api/v1/org/activated-deactivate-fleet',

  ALL_ORGANIZATIONS: '/api/v1/org/organizations/view-all',

  TOTAL_COLLECTION_PER_FLEET: '/api/payment/transactions/total-collection-per-fleet',

};
