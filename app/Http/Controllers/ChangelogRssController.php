<?php

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use App\Support\LocaleUrl;
use App\Support\SiteUri;
use Illuminate\Http\Response;

class ChangelogRssController extends Controller
{
    public function __invoke(ChangelogService $changelog): Response
    {
        $domain = SiteUri::normalize((string) config('meshchatx.domain'))
            ?? rtrim((string) config('meshchatx.domain'), '/');
        $pageUrl = LocaleUrl::route('changelog');
        $feedUrl = $domain.'/changelog.xml';

        $xml = view('feeds.changelog-rss', [
            'title' => config('meshchatx.name').' Changelog',
            'link' => $pageUrl,
            'feedUrl' => $feedUrl,
            'description' => 'Released MeshChatX versions and notable changes.',
            'entries' => $changelog->releasedEntries($changelog->rssLimit()),
        ])->render();

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml; charset=UTF-8',
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
