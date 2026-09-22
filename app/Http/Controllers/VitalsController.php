<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class VitalsController extends Controller
{
    private const METRICS = ['ttfb', 'fcp', 'lcp', 'inp'];

    public function __invoke(Request $request): Response
    {
        $data = json_decode($request->getContent(), true);
        if (! is_array($data) || strlen($request->getContent()) > 2048) {
            return response()->noContent(422);
        }

        $path = $data['path'] ?? null;
        if (! is_string($path) || ! preg_match('#^/[a-z0-9\-/_.]{0,160}$#i', $path)) {
            return response()->noContent(422);
        }

        $record = [
            'ts' => now()->toIso8601String(),
            'path' => $path,
            'nav' => in_array($data['nav'] ?? null, ['navigate', 'reload', 'back_forward', 'prerender'], true)
                ? $data['nav']
                : null,
            'conn' => in_array($data['conn'] ?? null, ['slow-2g', '2g', '3g', '4g'], true)
                ? $data['conn']
                : null,
        ];

        foreach (self::METRICS as $metric) {
            $value = $data[$metric] ?? null;
            $record[$metric] = is_numeric($value) && $value >= 0 && $value <= 120000
                ? round((float) $value)
                : null;
        }

        $cls = $data['cls'] ?? null;
        $record['cls'] = is_numeric($cls) && $cls >= 0 && $cls <= 50 ? round((float) $cls, 3) : null;

        if ($record['fcp'] === null && $record['lcp'] === null) {
            return response()->noContent(422);
        }

        Storage::disk('local')->append('vitals.ndjson', json_encode($record, JSON_UNESCAPED_SLASHES));

        return response()->noContent();
    }
}
