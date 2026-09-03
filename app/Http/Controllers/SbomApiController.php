<?php

namespace App\Http\Controllers;

use App\Services\SbomService;
use Illuminate\Http\JsonResponse;

class SbomApiController extends Controller
{
    public function __invoke(string $version, SbomService $sbom): JsonResponse
    {
        $payload = $sbom->forVersion($version);
        if ($payload === null) {
            return response()
                ->json(['error' => 'SBOM not found for this version.'], 404)
                ->header('Cache-Control', 'private, max-age=60');
        }

        return response()
            ->json($payload)
            ->header('Cache-Control', 'private, max-age=300');
    }
}
