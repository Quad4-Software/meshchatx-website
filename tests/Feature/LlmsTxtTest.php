<?php

namespace Tests\Feature;

use Tests\TestCase;

class LlmsTxtTest extends TestCase
{
    public function test_llms_txt_lists_docs_and_apis(): void
    {
        $this->get('/llms.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('# MeshChatX', false)
            ->assertSee('does not operate central message servers', false)
            ->assertSee('/docs/overview.md', false)
            ->assertSee('/docs/export-all/md', false)
            ->assertSee('/api/mcx-releases', false)
            ->assertSee('/llms-full.txt', false);
    }

    public function test_llms_full_txt_includes_documentation_body(): void
    {
        $this->get('/llms-full.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('# MeshChatX', false)
            ->assertSee('# Full documentation', false)
            ->assertSee('Getting started', false)
            ->assertSee('LXMF messaging', false);
    }

    public function test_docs_llms_txt_lists_markdown_pages(): void
    {
        $this->get('/docs/llms.txt')
            ->assertOk()
            ->assertSee('# MeshChatX documentation', false)
            ->assertSee('/docs/installation.md', false)
            ->assertSee('/docs/export-all/md', false);
    }

    public function test_docs_markdown_alias_is_inline(): void
    {
        $response = $this->get('/docs/overview.md');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
            ->assertHeaderMissing('Content-Disposition')
            ->assertSee('title: Overview', false);

        $link = (string) $response->headers->get('Link');
        $this->assertStringContainsString('rel="describedby"', $link);
        $this->assertStringContainsString('/docs/overview.md', $link);
    }

    public function test_docs_html_advertises_markdown_alternate(): void
    {
        $this->get('/docs/overview')
            ->assertOk()
            ->assertSee('rel="alternate"', false)
            ->assertSee('type="text/markdown"', false)
            ->assertSee('/docs/overview.md', false)
            ->assertSee('/llms.txt', false)
            ->assertSee('/docs/llms.txt', false);
    }

    public function test_robots_mentions_llms_txt(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('/llms.txt', false);
    }

    public function test_home_links_describedby_llms_txt(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('rel="describedby"', false)
            ->assertSee('/llms.txt', false);
    }
}
