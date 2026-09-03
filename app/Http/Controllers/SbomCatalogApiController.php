<?php

namespace App\Http\Controllers;

use App\Services\SbomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SbomCatalogApiController extends Controller
{
    public function __invoke(Request $request, SbomService $sbom): JsonResponse
    {
        if ($request->boolean('warm')) {
            $sbom->warmMissing(6);
        }

        return response()
            ->json($sbom->catalog())
            ->header('Cache-Control', 'private, max-age=60');
    }
}
