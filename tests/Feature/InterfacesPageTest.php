<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InterfacesPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_interfaces_page_lists_nodes_and_api_link(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response([
                'data' => [
                    [
                        'id' => 42,
                        'name' => 'Example TCP Node',
                        'type' => 'tcp',
                        'typeName' => 'TCPClientInterface',
                        'network' => 'clearnet',
                        'host' => 'rns.example.test',
                        'port' => 4242,
                        'status' => 'online',
                        'config' => "[[Example TCP Node]]\n  type = TCPClientInterface\n  enabled = yes\n  target_host = rns.example.test\n  target_port = 4242",
                    ],
                ],
            ], 200),
        ]);

        $this->get('/interfaces')
            ->assertOk()
            ->assertSee('Example TCP Node', false)
            ->assertSee('rns.example.test:4242', false)
            ->assertSee('TCPClientInterface', false)
            ->assertSee('/api/mcx-interfaces', false)
            ->assertSee('directory.rns.recipes', false)
            ->assertSee('Copy config', false)
            ->assertSee('ifx-card__config', false);
    }

    public function test_interfaces_api_returns_json_and_cors(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response([
                'data' => [
                    [
                        'id' => 7,
                        'name' => 'API Node',
                        'type' => 'i2p',
                        'typeName' => 'I2PInterface',
                        'network' => 'i2p',
                        'host' => 'abc.b32.i2p',
                        'port' => null,
                        'status' => 'online',
                        'config' => '[[API Node]]',
                    ],
                ],
            ], 200),
        ]);

        $this->getJson('/api/mcx-interfaces')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', '*')
            ->assertHeader('Cross-Origin-Resource-Policy', 'cross-origin')
            ->assertJsonPath('interfaces.0.name', 'API Node')
            ->assertJsonPath('count', 1)
            ->assertJsonStructure(['source', 'sourceApi', 'fetchedAt', 'stale', 'count', 'total', 'interfaces']);

        $this->getJson('/api/mcx-interfaces?type=i2p')
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->getJson('/api/mcx-interfaces?type=tcp')
            ->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonPath('total', 1);
    }

    public function test_locale_interfaces_page_responds(): void
    {
        Http::fake([
            'directory.rns.recipes/*' => Http::response(['data' => []], 200),
        ]);

        $this->get('/de/interfaces')->assertOk();
    }
}
