<?php

namespace App\Http\Controllers;

use App\Services\RnsDirectoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterfacesApiController extends Controller
{
    public function __invoke(Request $request, RnsDirectoryService $directory): JsonResponse
    {
        $search = $request->query('search');
        $type = $request->query('type');
        $network = $request->query('network');

        return response()
            ->json($directory->payload(
                is_string($search) ? $search : null,
                is_string($type) ? $type : null,
                is_string($network) ? $network : null,
            ))
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }
}
