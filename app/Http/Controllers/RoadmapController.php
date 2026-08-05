<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use App\Services\RoadmapService;
use Illuminate\View\View;

class RoadmapController extends Controller
{
    public function __invoke(GithubReleasesService $releases, RoadmapService $roadmap): View
    {
        $publishedVersions = $releases->publishedVersions();

        return view('pages.roadmap', [
            'items' => $roadmap->items($publishedVersions),
            'publishedVersions' => $publishedVersions,
        ]);
    }
}
