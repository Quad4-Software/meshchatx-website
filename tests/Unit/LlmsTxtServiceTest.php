<?php

namespace Tests\Unit;

use App\Services\LlmsTxtService;
use Tests\TestCase;

class LlmsTxtServiceTest extends TestCase
{
    public function test_site_index_uses_absolute_markdown_links(): void
    {
        $body = app(LlmsTxtService::class)->siteIndex();

        $this->assertStringContainsString('# MeshChatX', $body);
        $this->assertStringContainsString('## Documentation', $body);
        $this->assertStringContainsString('/docs/overview.md', $body);
        $this->assertStringContainsString('## Optional', $body);
        $this->assertStringNotContainsString('/docs/overview/export/md', $body);
    }

    public function test_docs_index_stays_scoped(): void
    {
        $body = app(LlmsTxtService::class)->docsIndex();

        $this->assertStringContainsString('# MeshChatX documentation', $body);
        $this->assertStringContainsString('/docs/messaging.md', $body);
        $this->assertStringNotContainsString('/download', $body);
    }
}
