const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://git.quad4.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join('; ');

const STATIC_CACHE_MAX_AGE = '31536000';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const response = await resolve(event);

  const pathname = event.url.pathname;
  if (/\.(png|jpg|jpeg|gif|ico|svg|webp|woff2?|css|js)$/i.test(pathname)) {
    response.headers.set('Cache-Control', `public, max-age=${STATIC_CACHE_MAX_AGE}, immutable`);
  }

  const isSecure =
    event.url.protocol === 'https:' ||
    event.request.headers.get('x-forwarded-proto') === 'https';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  response.headers.set('Content-Security-Policy', CSP_DIRECTIVES);
  response.headers.set('Vary', 'Origin');

  if (isSecure) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, status, message }) {
  return {
    status: status ?? 500,
    message: message ?? (error && error.message) ?? 'Something went wrong.'
  };
}
