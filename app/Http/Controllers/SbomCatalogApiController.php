<?php

namespace App\Http\Controllers;

use App\Services\SbomService;
use Illuminate\Http\JsonResponse;

class SbomCatalogApiController extends Controller
{
    public function __invoke(SbomService $sbom): JsonResponse
    {
        return response()
            ->json($sbom->catalog())
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
}
