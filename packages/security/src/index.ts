// Arcjet exports
export * from "./arcjet";

// Rate limit exports
export * from "./ratelimit";

// Check if any security provider is configured
export function isSecurityConfigured(): boolean {
  const { isArcjetConfigured } = require("./arcjet");
  const { isRedisConfigured } = require("./ratelimit");
  return isArcjetConfigured() || isRedisConfigured();
}
