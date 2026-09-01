<?php

namespace Tests\Unit;

use App\Services\DocsService;
use Tests\TestCase;

class DocsServiceTest extends TestCase
{
    public function test_lists_configured_slugs(): void
    {
        $docs = app(DocsService::class);

        $this->assertContains('overview', $docs->slugs());
        $this->assertContains('installation', $docs->slugs());
        $this->assertContains('identity-and-security', $docs->slugs());
        $this->assertContains('linux-sandbox', $docs->slugs());
        $this->assertTrue($docs->exists('messaging'));
        $this->assertFalse($docs->exists('missing-page'));
    }

    public function test_page_includes_prev_next_and_headings(): void
    {
        $docs = app(DocsService::class);
        $page = $docs->page('overview');

        $this->assertSame('Overview', $page['title']);
        $this->assertNotEmpty($page['html']);
        $this->assertNotEmpty($page['headings']);
        $this->assertNull($page['prev']);
        $this->assertNotNull($page['next']);
        $this->assertSame('getting-started', $page['next']['slug']);
    }

    public function test_search_index_includes_body_for_fuse(): void
    {
        $index = app(DocsService::class)->searchIndex();
        $titles = array_column($index, 'title');

        $this->assertContains('Overview', $titles);
        $this->assertContains('Installation and setup', $titles);

        $installation = collect($index)->firstWhere('slug', 'installation');
        $this->assertIsArray($installation);
        $this->assertArrayHasKey('body', $installation);
        $this->assertStringContainsString('Docker', $installation['body']);
    }

    public function test_export_all_markdown_includes_multiple_pages(): void
    {
        $all = app(DocsService::class)->exportAllMarkdown();

        $this->assertStringContainsString('# Overview', $all);
        $this->assertStringContainsString('# LXMF messaging', $all);
        $this->assertStringContainsString('# Linux sandboxing', $all);
    }
}
