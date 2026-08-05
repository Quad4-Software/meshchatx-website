<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(GithubReleasesService $releases): View
    {
        $payload = $releases->payload();

        return view('pages.home', [
            'releases' => $payload,
            'stableVersion' => $payload['stable']['version'] ?? null,
            'capabilities' => config('meshchatx.capabilities', []),
            'showcaseTabs' => config('meshchatx.showcase_tabs', []),
        ]);
    }
}
