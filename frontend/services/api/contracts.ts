import type { ApiCallOptions } from './core'

type ApiRequestPreset = Pick<
  ApiCallOptions,
  'feature' | 'action' | 'method' | 'url' | 'unwrapResult' | 'includeAuth' | 'timeoutMs'
>

function defineRequest<T extends ApiRequestPreset>(request: T): T {
  return request
}

const encodePathSegment = (value: string) => encodeURIComponent(value)

export const API_ENDPOINTS = {
  auth: {
    authenticate: '/auth/authenticate',
    refreshToken: '/auth/refresh-token',
  },
  weather: {
    weather: '/weather',
  },
  farm: {
    me: '/farm/me',
  },
  network: {
    publicIp: '/network/public-ip',
  },
  market: {
    prices: '/market/prices',
    searchPrices: '/market/prices/search',
    recentlyPrices: '/market/prices/recently',
    settlementPrices: '/market/prices/settlements',
    saveSettlementPrices: '/market/prices/settlements/save',
    settlementAvgPrices: '/market/prices/average',
    settlementAvgPricesByWeek: '/market/prices/db/avg-week',
    settlementAvgPricesByRange: '/market/prices/db/avg-range',
    markets: '/market/meta/markets',
    items: '/market/meta/items',
  },
  sensor: {
    summaryByType: '/sensor/summary',
    recent: '/sensor/recent',
  },
  admin: {
    sensor: '/admin/sensor',
    sensorDetail: (code: string) => `/admin/sensor/${encodePathSegment(code)}`,
    sensorKit: '/admin/sensorkit',
    sensorKitDetail: (code: string) => `/admin/sensorkit/${encodePathSegment(code)}`,
    farm: '/admin/farm',
    accountRegister: '/admin/account/register',
    account: '/admin/account',
    accountDetail: (username: string) => `/admin/account/${encodePathSegment(username)}`,
    accountResetPassword: (username: string) =>
      `/admin/account/reset-password/${encodePathSegment(username)}`,
    good: '/admin/good',
  },
} as const

export const API_REQUESTS = {
  auth: {
    authenticate: defineRequest({
      feature: 'auth',
      action: 'authenticate',
      method: 'POST',
      url: API_ENDPOINTS.auth.authenticate,
      unwrapResult: false,
      includeAuth: false,
    }),
    refreshToken: defineRequest({
      feature: 'auth',
      action: 'refreshToken',
      method: 'POST',
      url: API_ENDPOINTS.auth.refreshToken,
      unwrapResult: false,
      includeAuth: false,
    }),
  },
  weather: {
    getWeather: defineRequest({
      feature: 'weather',
      action: 'getWeather',
      method: 'GET',
      url: API_ENDPOINTS.weather.weather,
      timeoutMs: 30000,
    }),
  },
  farm: {
    getMyFarmInfo: defineRequest({
      feature: 'farm',
      action: 'getMyFarmInfo',
      method: 'GET',
      url: API_ENDPOINTS.farm.me,
      unwrapResult: false,
    }),
  },
  network: {
    getPublicIp: defineRequest({
      feature: 'network',
      action: 'getPublicIp',
      method: 'GET',
      url: API_ENDPOINTS.network.publicIp,
      unwrapResult: false,
    }),
  },
  market: {
    getMarketPrices: defineRequest({
      feature: 'market',
      action: 'getMarketPrices',
      method: 'GET',
      url: API_ENDPOINTS.market.prices,
    }),
    searchMarketPrices: defineRequest({
      feature: 'market',
      action: 'searchMarketPrices',
      method: 'GET',
      url: API_ENDPOINTS.market.searchPrices,
      unwrapResult: false,
      timeoutMs: 30000,
    }),
    getRecentlyPrices: defineRequest({
      feature: 'market',
      action: 'getRecentlyPrices',
      method: 'GET',
      url: API_ENDPOINTS.market.recentlyPrices,
      unwrapResult: false,
      timeoutMs: 30000,
    }),
    getSettlementPricesByRange: defineRequest({
      feature: 'market',
      action: 'getSettlementPricesByRange',
      method: 'GET',
      url: API_ENDPOINTS.market.settlementPrices,
    }),
    collectAndSaveSettlementPrices: defineRequest({
      feature: 'market',
      action: 'collectAndSaveSettlementPrices',
      method: 'POST',
      url: API_ENDPOINTS.market.saveSettlementPrices,
    }),
    getSettlementAvgPrices: defineRequest({
      feature: 'market',
      action: 'getSettlementAvgPrices',
      method: 'GET',
      url: API_ENDPOINTS.market.settlementAvgPrices,
    }),
    getSettlementAvgPricesByWeek: defineRequest({
      feature: 'market',
      action: 'getSettlementAvgPricesByWeek',
      method: 'GET',
      url: API_ENDPOINTS.market.settlementAvgPricesByWeek,
    }),
    getSettlementAvgPricesByRange: defineRequest({
      feature: 'market',
      action: 'getSettlementAvgPricesByRange',
      method: 'GET',
      url: API_ENDPOINTS.market.settlementAvgPricesByRange,
    }),
    getMarkets: defineRequest({
      feature: 'market',
      action: 'getMarkets',
      method: 'GET',
      url: API_ENDPOINTS.market.markets,
      unwrapResult: false,
    }),
    getItems: defineRequest({
      feature: 'market',
      action: 'getItems',
      method: 'GET',
      url: API_ENDPOINTS.market.items,
      unwrapResult: false,
    }),
  },
  sensor: {
    getSensorTypeSummary: defineRequest({
      feature: 'sensor',
      action: 'sensorTypeSummary',
      method: 'GET',
      url: API_ENDPOINTS.sensor.summaryByType,
      unwrapResult: false,
    }),
    getRecentSensorData: defineRequest({
      feature: 'sensor',
      action: 'recentSensorData',
      method: 'GET',
      url: API_ENDPOINTS.sensor.recent,
      unwrapResult: false,
    }),
  },
  admin: {
    getSensorList: defineRequest({
      feature: 'admin',
      action: 'getSensorList',
      method: 'GET',
      url: API_ENDPOINTS.admin.sensor,
      unwrapResult: false,
    }),
    registerSensor: defineRequest({
      feature: 'admin',
      action: 'registerSensor',
      method: 'POST',
      url: API_ENDPOINTS.admin.sensor,
      unwrapResult: false,
    }),
    updateSensor: defineRequest({
      feature: 'admin',
      action: 'updateSensor',
      method: 'PATCH',
      url: API_ENDPOINTS.admin.sensor,
      unwrapResult: false,
    }),
    getSensorDetail: (code: string) =>
      defineRequest({
        feature: 'admin',
        action: 'getSensorDetail',
        method: 'GET',
        url: API_ENDPOINTS.admin.sensorDetail(code),
        unwrapResult: false,
      }),
    getSensorKitList: defineRequest({
      feature: 'admin',
      action: 'getSensorKitList',
      method: 'GET',
      url: API_ENDPOINTS.admin.sensorKit,
      unwrapResult: false,
    }),
    getSensorKitDetail: (code: string) =>
      defineRequest({
        feature: 'admin',
        action: 'getSensorKitDetail',
        method: 'GET',
        url: API_ENDPOINTS.admin.sensorKitDetail(code),
        unwrapResult: false,
      }),
    registerFarm: defineRequest({
      feature: 'admin',
      action: 'registerFarm',
      method: 'POST',
      url: API_ENDPOINTS.admin.farm,
      unwrapResult: false,
    }),
    registerAccount: defineRequest({
      feature: 'admin',
      action: 'registerAccount',
      method: 'POST',
      url: API_ENDPOINTS.admin.accountRegister,
      unwrapResult: false,
    }),
    getAccountList: defineRequest({
      feature: 'admin',
      action: 'getAccountList',
      method: 'GET',
      url: API_ENDPOINTS.admin.account,
      unwrapResult: false,
    }),
    updateAccount: defineRequest({
      feature: 'admin',
      action: 'updateAccount',
      method: 'PATCH',
      url: API_ENDPOINTS.admin.account,
      unwrapResult: false,
    }),
    getAccountDetail: (username: string) =>
      defineRequest({
        feature: 'admin',
        action: 'getAccountDetail',
        method: 'GET',
        url: API_ENDPOINTS.admin.accountDetail(username),
        unwrapResult: false,
      }),
    randomChangePassword: (username: string) =>
      defineRequest({
        feature: 'admin',
        action: 'randomChangePassword',
        method: 'PATCH',
        url: API_ENDPOINTS.admin.accountResetPassword(username),
        unwrapResult: false,
      }),
    getAllGood: defineRequest({
      feature: 'admin',
      action: 'getAllGood',
      method: 'GET',
      url: API_ENDPOINTS.admin.good,
      unwrapResult: false,
    }),
  },
} as const
