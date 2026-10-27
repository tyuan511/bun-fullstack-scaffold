export interface RequestIdOptions {
  /**
   * Header name for request ID. Defaults to "x-request-id"
   */
  headerName?: string;
  /**
   * Custom request ID generator. Defaults to crypto.randomUUID()
   */
  generateId?: () => string;
}

export interface SecurityHeadersOptions {
  /**
   * Value for X-Frame-Options. Defaults to "SAMEORIGIN"
   */
  frameOptions?: "DENY" | "SAMEORIGIN" | false;
  /**
   * Enable X-Content-Type-Options: nosniff. Defaults to true
   */
  contentTypeOptions?: boolean;
  /**
   * Value for Referrer-Policy. Defaults to "strict-origin-when-cross-origin"
   */
  referrerPolicy?: string | false;
  /**
   * Enable X-XSS-Protection. Defaults to "1; mode=block"
   */
  xssProtection?: string | false;
  /**
   * Value for Permissions-Policy. Defaults to "camera=(), microphone=(), geolocation=()"
   */
  permissionsPolicy?: string | false;
}

export interface CorsOptions {
  /**
   * Allowed origin(s). Defaults to "*"
   */
  origin?: string | string[];
  /**
   * Allowed HTTP methods. Defaults to "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
   */
  methods?: string[];
  /**
   * Allowed request headers.
   */
  allowedHeaders?: string[];
  /**
   * Preflight cache max age in seconds. Defaults to 86400 (24h)
   */
  maxAge?: number;
}

export interface RateLimiterOptions {
  /**
   * Maximum allowed requests within the time window. Defaults to 120.
   */
  max?: number;
  /**
   * Time window in milliseconds. Defaults to 60_000 (1 minute).
   */
  windowMs?: number;
  /**
   * Path prefix to apply rate limiting. Defaults to "/api"
   */
  pathPrefix?: string;
  /**
   * Custom function to extract client identifier (e.g. IP address).
   */
  keyGenerator?: (request: Request) => string;
  /**
   * Function to skip rate limiting for specific requests (e.g., /api/health).
   */
  skip?: (path: string, request: Request) => boolean;
}

export interface LoggerOptions {
  /**
   * Whether to skip logging static asset requests. Defaults to true.
   */
  skipAssets?: boolean;
  /**
   * Custom filter function to skip logging.
   */
  skip?: (path: string, request: Request) => boolean;
}
