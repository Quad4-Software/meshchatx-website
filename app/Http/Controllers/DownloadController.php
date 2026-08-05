<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DownloadController extends Controller
{
    public function __invoke(Request $request, GithubReleasesService $releases): View
    {
        $channel = $request->query('channel') === 'prerelease'
            ? 'prerelease'
            : 'stable';

        return view('pages.download', [
            'releases' => $releases->payload(),
            'channel' => $channel,
        ]);
    }
}
