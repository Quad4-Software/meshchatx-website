<?php

namespace App\Http\Controllers;

use App\Support\SiteUri;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $domain = SiteUri::normalize((string) config('meshchatx.domain'))
            ?? rtrim((string) config('meshchatx.domain'), '/');

        $body = "User-agent: *\nAllow: /\n\nSitemap: {$domain}/sitemap.xml\n# LLM index: {$domain}/llms.txt\n";

        return response($body, 200)
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
