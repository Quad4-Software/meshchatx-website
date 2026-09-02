<?php

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use Illuminate\View\View;

class ChangelogController extends Controller
{
    public function __invoke(ChangelogService $changelog): View
    {
        $payload = $changelog->page(1);

        return view('pages.changelog', [
            'page' => 'changelog',
            'entries' => $payload['entries'],
            'toc' => $changelog->toc(),
            'pagination' => $payload,
            'entriesUrl' => locale_route('changelog.entries'),
            'sourceUrl' => (string) config('meshchatx.github_changelog'),
            'rssUrl' => url('/changelog.xml'),
        ]);
    }
}
