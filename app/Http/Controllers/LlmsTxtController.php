<?php

namespace App\Http\Controllers;

use App\Services\LlmsTxtService;
use Illuminate\Http\Response;

class LlmsTxtController extends Controller
{
    public function __construct(private readonly LlmsTxtService $llms) {}

    public function index(): Response
    {
        return $this->plain($this->llms->siteIndex());
    }

    public function full(): Response
    {
        return $this->plain($this->llms->fullText());
    }

    public function docs(): Response
    {
        return $this->plain($this->llms->docsIndex());
    }

    private function plain(string $body): Response
    {
        return response($body, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
            'Link' => '</llms.txt>; rel="describedby"',
        ]);
    }
}
