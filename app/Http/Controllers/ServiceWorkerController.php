<?php

namespace App\Http\Controllers;

use App\Support\PwaAssets;
use Illuminate\Http\Response;

class ServiceWorkerController extends Controller
{
    public function __invoke(): Response
    {
        $version = PwaAssets::cacheVersion();
        $precache = PwaAssets::precacheUrls();
        $locales = config('meshchatx.prefixed_locales', ['de', 'es', 'fi', 'fr', 'it', 'nl', 'ru', 'zh']);
        $localePrefix = '/(?:'.implode('|', array_map('preg_quote', $locales)).')(?=/|$)';

        return response()
            ->view('pwa.sw', [
                'version' => $version,
                'precache' => $precache,
                'offlineUrl' => '/offline',
                'localePrefix' => $localePrefix,
            ])
            ->header('Content-Type', 'application/javascript; charset=UTF-8')
            ->header('Service-Worker-Allowed', '/')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
