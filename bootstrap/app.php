<?php

use App\Http\Middleware\DetectBrowserLocale;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use App\Support\ErrorCopy;
use App\Support\PreferredLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'locale' => SetLocale::class,
        ]);

        $middleware->encryptCookies(except: [
            PreferredLocale::COOKIE,
        ]);

        $middleware->web(remove: [
            StartSession::class,
            ShareErrorsFromSession::class,
            ValidateCsrfToken::class,
            PreventRequestForgery::class,
        ]);

        $middleware->appendToGroup('web', [
            SecurityHeaders::class,
            DetectBrowserLocale::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return app(SecurityHeaders::class)->apply($request, $response);
            }

            $status = $response->getStatusCode();

            if ($status < 400) {
                return $response;
            }

            if ($status === 500 && config('app.debug')) {
                return $response;
            }

            app()->setLocale(ErrorCopy::localeFromRequest($request));

            $view = view()->exists('errors.'.$status)
                ? 'errors.'.$status
                : 'errors.generic';

            $errorResponse = response()->view($view, [
                'status' => $status,
                'page' => 'error',
            ], $status);

            return app(SecurityHeaders::class)->apply($request, $errorResponse);
        });
    })->create();
