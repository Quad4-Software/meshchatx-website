<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VitalsApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('mcx-vitals');
    }

    public function test_vitals_beacon_is_stored(): void
    {
        Storage::fake('local');

        $this->call('POST', '/api/vitals', [], [], [], [], json_encode([
            'v' => 1,
            'path' => '/download',
            'nav' => 'navigate',
            'conn' => '4g',
            'ttfb' => 120.4,
            'fcp' => 480.6,
            'lcp' => 540.2,
            'cls' => 0.0012,
            'inp' => 64,
        ]))->assertNoContent();

        $line = trim((string) Storage::disk('local')->get('vitals.ndjson'));
        $record = json_decode($line, true);

        $this->assertSame('/download', $record['path']);
        $this->assertSame(540, $record['lcp']);
        $this->assertSame(0.001, $record['cls']);
        $this->assertSame('4g', $record['conn']);
    }

    public function test_vitals_rejects_bad_payloads(): void
    {
        Storage::fake('local');

        $this->call('POST', '/api/vitals', [], [], [], [], 'not json')->assertStatus(422);
        $this->call('POST', '/api/vitals', [], [], [], [], json_encode([
            'path' => 'https://evil.example/x',
            'fcp' => 100,
        ]))->assertStatus(422);
        $this->call('POST', '/api/vitals', [], [], [], [], json_encode([
            'path' => '/ok',
            'lcp' => 'bogus',
            'cls' => 99,
        ]))->assertStatus(422);

        $this->assertFalse(Storage::disk('local')->exists('vitals.ndjson'));
    }

    public function test_vitals_limiter_is_registered(): void
    {
        $this->assertNotNull(app(\Illuminate\Cache\RateLimiter::class)->limiter('mcx-vitals'));
    }
}
