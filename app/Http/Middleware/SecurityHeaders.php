<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        return $this->apply($request, $next($request));
    }

    public function apply(Request $request, Response $response): Response
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set(
            'Permissions-Policy',
            'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
        );
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        if ($request->is('api/*')) {
            $response->headers->set('Cross-Origin-Resource-Policy', 'cross-origin');
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Accept');
        } else {
            $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        }
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy());

        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }

    private function contentSecurityPolicy(): string
    {
        $scriptSrc = ["'self'"];
        $styleSrc = ["'self'", "'unsafe-inline'"];
        $fontSrc = ["'self'"];
        $connectSrc = ["'self'"];
        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "img-src 'self' data: https:",
            "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
        ];

        foreach ($this->viteDevOrigins() as $origin) {
            $scriptSrc[] = $origin;
            $styleSrc[] = $origin;
            $fontSrc[] = $origin;
            $connectSrc[] = $origin;
            $connectSrc[] = preg_replace('/^http/', 'ws', $origin) ?? $origin;
        }

        $directives[] = 'font-src '.implode(' ', array_unique($fontSrc));
        $directives[] = 'style-src '.implode(' ', array_unique($styleSrc));
        $directives[] = 'script-src '.implode(' ', array_unique($scriptSrc));
        $directives[] = 'connect-src '.implode(' ', array_unique($connectSrc));

        if (! app()->environment('local')) {
            $directives[] = 'upgrade-insecure-requests';
        }

        return implode('; ', $directives);
    }

    /**
     * CSP source lists reject IPv6 literals like http://[::1]:5173.
     * Vite is pinned to 127.0.0.1 in vite.config.js so hot URLs match.
     *
     * @return list<string>
     */
    private function viteDevOrigins(): array
    {
        if (! app()->environment('local')) {
            return [];
        }

        $hot = public_path('hot');
        if (! File::exists($hot)) {
            return [];
        }

        $raw = trim((string) File::get($hot));
        if ($raw === '') {
            return [];
        }

        $origin = rtrim($raw, '/');
        $origin = str_replace(['[::1]', '::1'], '127.0.0.1', $origin);

        $parts = parse_url($origin);
        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return [];
        }

        $scheme = strtolower((string) $parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            return [];
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $hosts = ['127.0.0.1', 'localhost'];

        $origins = [];
        foreach ($hosts as $host) {
            $origins[] = $scheme.'://'.$host.$port;
        }

        return array_values(array_unique($origins));
    }
}
