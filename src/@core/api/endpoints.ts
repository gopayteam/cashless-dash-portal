export const API_ENDPOINTS = {
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
};
