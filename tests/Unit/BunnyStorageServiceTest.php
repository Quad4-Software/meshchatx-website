<?php

namespace Tests\Unit;

use App\Services\BunnyStorageService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BunnyStorageServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config([
            'services.bunny.storage_zone' => 'meshchatx',
            'services.bunny.access_key' => 'test-key',
            'services.bunny.storage_endpoint' => 'https://la.storage.bunnycdn.com',
            'services.bunny.cdn_base' => 'https://meshchatx.b-cdn.net',
        ]);
    }

    public function test_assets_by_name_walks_version_once_and_caches(): void
    {
        Http::fake([
            'la.storage.bunnycdn.com/meshchatx/' => Http::response([
                [
                    'ObjectName' => 'nightly',
                    'IsDirectory' => true,
                    'DateCreated' => '2026-09-03T13:00:00',
                ],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/' => Http::response([
                [
                    'ObjectName' => 'nightly-2026.09.03-0cc046e',
                    'IsDirectory' => true,
                    'DateCreated' => '2026-09-03T13:02:40',
                ],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/nightly-2026.09.03-0cc046e/' => Http::response([
                [
                    'ObjectName' => 'ReticulumMeshChatX-v4.8.6-linux-x86_64.AppImage',
                    'IsDirectory' => false,
                    'Checksum' => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ],
                [
                    'ObjectName' => 'android',
                    'IsDirectory' => true,
                ],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/nightly-2026.09.03-0cc046e/android/' => Http::response([
                [
                    'ObjectName' => 'ReticulumMeshChatX-v4.8.6-android-universal.apk',
                    'IsDirectory' => false,
                    'Checksum' => 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                ],
            ], 200),
        ]);

        $service = app(BunnyStorageService::class);
        $first = $service->assetsByName('nightly-2026.09.03-0cc046e');
        $second = $service->assetsByName('nightly-2026.09.03-0cc046e');

        $this->assertSame(
            'https://meshchatx.b-cdn.net/nightly/nightly-2026.09.03-0cc046e/android/ReticulumMeshChatX-v4.8.6-android-universal.apk',
            $first['reticulummeshchatx-v4.8.6-android-universal.apk']['url'] ?? null,
        );
        $this->assertSame(
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            $first['reticulummeshchatx-v4.8.6-android-universal.apk']['sha256'] ?? null,
        );
        $this->assertSame(
            'https://meshchatx.b-cdn.net/nightly/nightly-2026.09.03-0cc046e/ReticulumMeshChatX-v4.8.6-linux-x86_64.AppImage',
            $first['reticulummeshchatx-v4.8.6-linux-x86_64.appimage']['url'] ?? null,
        );
        $this->assertSame($first, $second);

        Http::assertSentCount(4);
    }

    public function test_disabled_without_access_key(): void
    {
        config(['services.bunny.access_key' => '']);
        Http::fake();

        $service = app(BunnyStorageService::class);

        $this->assertFalse($service->enabled());
        $this->assertSame([], $service->assetsByName('nightly-2026.09.03-0cc046e'));
        Http::assertNothingSent();
    }
}
