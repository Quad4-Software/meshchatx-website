<?php

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ChangelogEntriesController extends Controller
{
    public function __invoke(Request $request, ChangelogService $changelog): Response
    {
        $page = max(1, (int) $request->query('page', 1));
        $until = $request->query('until');
        $untilAnchor = is_string($until) ? trim($until) : '';
        $toPage = $page;

        if ($untilAnchor !== '') {
            $target = $changelog->pageForAnchor($untilAnchor);
            if ($target !== null) {
                $toPage = max($page, $target);
            }
        }

        $payload = $page === $toPage
            ? $changelog->page($page)
            : $changelog->pageRange($page, $toPage);

        $html = view('partials.changelog-entries', [
            'entries' => $payload['entries'],
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'private, max-age=60',
            'X-Changelog-Page' => (string) $payload['page'],
            'X-Changelog-Has-More' => $payload['has_more'] ? '1' : '0',
            'X-Changelog-Next-Page' => $payload['next_page'] !== null ? (string) $payload['next_page'] : '',
            'X-Changelog-Total-Pages' => (string) $payload['total_pages'],
        ]);
    }
}
