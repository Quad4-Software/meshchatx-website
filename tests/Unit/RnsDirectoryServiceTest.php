<?php

namespace Tests\Unit;

use App\Services\RnsDirectoryService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RnsDirectoryServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $snapshot = storage_path('app/private/rns-interfaces.json');
        if (is_file($snapshot)) {
            unlink($snapshot);
        }
    }

    public function test_fetches_and_normalizes_online_interfaces(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response([
                'data' => [
                    [
                        'id' => 2,
                        'name' => 'Zulu TCP',
                        'type' => 'tcp',
                        'typeName' => 'TCPClientInterface',
                        'network' => 'clearnet',
                        'host' => 'zulu.example',
                        'port' => 4242,
                        'status' => 'online',
                        'config' => "[[Zulu TCP]]\n  type = TCPClientInterface",
                    ],
                    [
                        'id' => 1,
                        'name' => 'Alpha Backbone',
                        'type' => 'backbone',
                        'typeName' => 'BackboneInterface',
                        'network' => 'yggdrasil',
                        'host' => '200:1::1',
                        'port' => 4242,
                        'status' => 'online',
                        'config' => '[[Alpha Backbone]]',
                    ],
                ],
            ], 200),
        ]);

        $payload = app(RnsDirectoryService::class)->payload();

        $this->assertFalse($payload['stale']);
        $this->assertSame(2, $payload['count']);
        $this->assertSame(2, $payload['total']);
        $this->assertSame('Alpha Backbone', $payload['interfaces'][0]['name']);
        $this->assertSame('Zulu TCP', $payload['interfaces'][1]['name']);
        $this->assertSame('https://directory.rns.recipes/', $payload['source']);
    }

    public function test_filters_by_type_search_and_network(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response([
                'data' => [
                    [
                        'id' => 1,
                        'name' => 'Clear TCP',
                        'type' => 'tcp',
                        'typeName' => 'TCPClientInterface',
                        'network' => 'clearnet',
                        'host' => 'tcp.example',
                        'port' => 4242,
                        'status' => 'online',
                        'config' => '',
                    ],
                    [
                        'id' => 2,
                        'name' => 'Ygg Backbone',
                        'type' => 'backbone',
                        'typeName' => 'BackboneInterface',
                        'network' => 'yggdrasil',
                        'host' => '200:2::2',
                        'port' => 4242,
                        'status' => 'online',
                        'config' => '',
                    ],
                ],
            ], 200),
        ]);

        $service = app(RnsDirectoryService::class);

        $tcp = $service->payload(null, 'tcp', null);
        $this->assertSame(1, $tcp['count']);
        $this->assertSame(2, $tcp['total']);
        $this->assertSame('Clear TCP', $tcp['interfaces'][0]['name']);

        $ygg = $service->payload(null, null, 'yggdrasil');
        $this->assertSame(1, $ygg['count']);
        $this->assertSame('Ygg Backbone', $ygg['interfaces'][0]['name']);

        $search = $service->payload('tcp.example');
        $this->assertSame(1, $search['count']);
        $this->assertSame('Clear TCP', $search['interfaces'][0]['name']);
    }

    public function test_uses_stale_cache_when_upstream_fails(): void
    {
        Cache::put('meshchatx.rns.directory.stale', [
            'source' => 'https://directory.rns.recipes/',
            'sourceApi' => 'https://example.test',
            'fetchedAt' => '2026-08-01T00:00:00Z',
            'stale' => false,
            'count' => 1,
            'total' => 1,
            'interfaces' => [
                [
                    'id' => 9,
                    'name' => 'Cached Node',
                    'type' => 'tcp',
                    'typeName' => 'TCPClientInterface',
                    'network' => 'clearnet',
                    'host' => 'cached.example',
                    'port' => 4242,
                    'status' => 'online',
                    'config' => '',
                ],
            ],
        ], 3600);

        Http::fake([
            'directory.rns.recipes/*' => Http::response('down', 503),
        ]);

        $payload = app(RnsDirectoryService::class)->payload();

        $this->assertTrue($payload['stale']);
        $this->assertSame('Cached Node', $payload['interfaces'][0]['name'] ?? null);
    }

    public function test_falls_back_to_bootstrap_snapshot_when_cache_empty(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response('down', 503),
        ]);

        $payload = app(RnsDirectoryService::class)->payload();

        $this->assertTrue($payload['stale']);
        $this->assertGreaterThan(0, $payload['count']);
        $this->assertNotEmpty($payload['interfaces'][0]['name'] ?? null);
        $this->assertNotEmpty($payload['interfaces'][0]['host'] ?? null);
    }
}
