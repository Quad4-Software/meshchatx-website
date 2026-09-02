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

        return response()
            ->view('pwa.sw', [
                'version' => $version,
                'precache' => $precache,
                'offlineUrl' => '/offline',
            ])
            ->header('Content-Type', 'application/javascript; charset=UTF-8')
            ->header('Service-Worker-Allowed', '/')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
