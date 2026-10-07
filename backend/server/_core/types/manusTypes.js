// WebDev Auth TypeScript types
// Auto-generated from protobuf definitions
// Generated on: 2025-09-24T05:57:57.338Z

/**
 * @typedef {Object} AuthorizeRequest
 * @property {string} redirectUri
 * @property {string} projectId
 * @property {string} state
 * @property {string} responseType
 * @property {string} scope
 */

/**
 * @typedef {Object} AuthorizeResponse
 * @property {string} redirectUrl
 */

/**
 * @typedef {Object} ExchangeTokenRequest
 * @property {string} grantType
 * @property {string} code
 * @property {string} [refreshToken]
 * @property {string} clientId
 * @property {string} [clientSecret]
 * @property {string} redirectUri
 */

/**
 * @typedef {Object} ExchangeTokenResponse
 * @property {string} accessToken
 * @property {string} tokenType
 * @property {number} expiresIn
 * @property {string} [refreshToken]
 * @property {string} scope
 * @property {string} idToken
 */

/**
 * @typedef {Object} GetUserInfoRequest
 * @property {string} accessToken
 */

/**
 * @typedef {Object} GetUserInfoResponse
 * @property {string} openId
 * @property {string} projectId
 * @property {string} name
 * @property {string} [email]
 * @property {string} [platform]
 * @property {string} [loginMethod]
 */

/**
 * @typedef {Object} CanAccessRequest
 * @property {string} openId
 * @property {string} projectId
 */

/**
 * @typedef {Object} CanAccessResponse
 * @property {boolean} canAccess
 */

/**
 * @typedef {Object} GetUserInfoWithJwtRequest
 * @property {string} jwtToken
 * @property {string} projectId
 */

/**
 * @typedef {Object} GetUserInfoWithJwtResponse
 * @property {string} openId
 * @property {string} projectId
 * @property {string} name
 * @property {string} [email]
 * @property {string} [platform]
 * @property {string} [loginMethod]
 * @property {string} [taskUid] Cron-only; references `schedule_task.uid`.
 */

// Export empty object to satisfy imports
export {};