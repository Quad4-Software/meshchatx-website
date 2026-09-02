<?php

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use App\Services\GithubReleasesService;
use App\Services\RoadmapService;
use Illuminate\View\View;

class RoadmapController extends Controller
{
    public function __invoke(
        GithubReleasesService $releases,
        RoadmapService $roadmap,
        ChangelogService $changelog,
    ): View {
        $publishedVersions = $releases->publishedVersions();
        $items = $roadmap->items($publishedVersions);
        $changelogByVersion = $changelog->releasedByVersion();
        $rail = $roadmap->rail($items, $publishedVersions, $changelogByVersion);

        return view('pages.roadmap', [
            'items' => $items,
            'rail' => $rail,
            'railProgress' => $roadmap->railProgress($rail),
            'publishedVersions' => $publishedVersions,
        ]);
    }
}
