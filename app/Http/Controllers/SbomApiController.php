<?php

namespace App\Http\Controllers;

use App\Services\SbomService;
use Illuminate\Http\JsonResponse;

class SbomApiController extends Controller
{
    public function __invoke(string $version, SbomService $sbom): JsonResponse
    {
        if (strlen($version) > 64) {
            return response()
                ->json(['error' => 'SBOM not found for this version.'], 404)
                ->header('Cache-Control', 'public, max-age=60');
        }

        $payload = $sbom->forVersion($version);
        if ($payload === null) {
            return response()
                ->json(['error' => 'SBOM not found for this version.'], 404)
                ->header('Cache-Control', 'public, max-age=60');
        }

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }
}
