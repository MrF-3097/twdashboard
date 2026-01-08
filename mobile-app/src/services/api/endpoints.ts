/**
 * API Endpoints Definitions
 * Centralized endpoint configuration
 */

// API_BASE is now included in the client's baseURL, so endpoints are relative
export const endpoints = {
  auth: {
    login: '/auth/login',
    status: '/auth/status',
  },
  properties: {
    list: '/properties',
    detail: (id: string) => `/properties/${id}`,
    images: (id: string) => `/rebs/property-images/${id}`,
    add: '/rebs/add-property',
  },
  requests: {
    list: '/requests',
    detail: (id: string) => `/requests/${id}`,
    add: '/rebs/add-request',
  },
  transactions: {
    list: '/admin/transactions',
    detail: (id: string) => `/admin/transactions/${id}`,
    add: '/admin/add-transaction',
  },
  leaderboard: {
    list: '/leaderboard',
    checkChanges: '/leaderboard/check-changes',
  },
  agents: {
    list: '/agents',
    detail: (id: string) => `/agents/${id}`,
    updateTarget: '/agents/update-target',
  },
  notifications: {
    subscribe: '/notifications/subscribe',
    unsubscribe: '/notifications/subscribe',
  },
  tools: {
    convertDocument: '/convert-document',
    fixPhoto: '/fix-photo',
    generateAd: '/real-estate/generate',
  },
} as const;


