<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use Illuminate\Http\JsonResponse;

class ReleasesApiController extends Controller
{
    public function __invoke(GithubReleasesService $releases): JsonResponse
    {
        return response()
            ->json($releases->payload())
            ->header('Cache-Control', 'private, max-age=30');
    }
}
