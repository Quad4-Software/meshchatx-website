<?php

namespace App\Http\Controllers;

use App\Services\SbomService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DependencyController extends Controller
{
    public function __invoke(Request $request, SbomService $sbom): View
    {
        $catalog = $sbom->catalog();
        $requested = $request->query('v');
        $version = null;
        if (is_string($requested) && $requested !== '' && strlen($requested) <= 64) {
            $version = $requested;
        } else {
            $version = $catalog['defaultVersion'] ?? null;
        }

        $payload = is_string($version) ? $sbom->forVersion($version) : null;
        if ($payload === null && is_string($catalog['defaultVersion'] ?? null)) {
            $payload = $sbom->forVersion((string) $catalog['defaultVersion']);
            $version = $catalog['defaultVersion'];
        }

        return view('pages.dependency', [
            'catalog' => $catalog,
            'sbom' => $payload,
            'selectedVersion' => $version,
            'apiCatalogUrl' => url('/api/mcx-sbom'),
            'apiSbomBase' => url('/api/mcx-sbom'),
        ]);
    }
}
