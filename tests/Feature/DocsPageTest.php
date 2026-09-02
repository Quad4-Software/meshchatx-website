<?php

namespace Tests\Feature;

use Tests\TestCase;

class DocsPageTest extends TestCase
{
    public function test_docs_index_redirects_to_overview(): void
    {
        $this->get('/docs')
            ->assertRedirect('/docs/overview');
    }

    public function test_docs_overview_renders_markdown(): void
    {
        $this->get('/docs/overview')
            ->assertOk()
            ->assertSee('Overview', false)
            ->assertSee('Reticulum', false)
            ->assertSee('data-docs-search', false)
            ->assertSee('Search docs', false)
            ->assertSee('docs-nav', false)
            ->assertSee('Getting started', false)
            ->assertSee('Download all docs', false);
    }

    public function test_docs_installation_from_app_bundle(): void
    {
        $this->get('/docs/installation')
            ->assertOk()
            ->assertSee('Docker', false)
            ->assertSee('reticulum-meshchatx', false)
            ->assertSee('MESHCHAT_HOST', false);
    }

    public function test_docs_export_markdown_and_text(): void
    {
        $this->get('/docs/overview/export/md')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
            ->assertSee('title: Overview', false);

        $this->get('/docs/overview/export/txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Overview', false);
    }

    public function test_docs_export_all(): void
    {
        $this->get('/docs/export-all/md')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
            ->assertSee('Getting started', false)
            ->assertSee('LXMF messaging', false);

        $this->get('/docs/export-all/txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Installation and setup', false);

        $pdf = $this->get('/docs/export-all/pdf');
        $pdf->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $pdf->getContent());

        $epub = $this->get('/docs/export-all/epub');
        $epub->assertOk()
            ->assertHeader('Content-Type', 'application/epub+zip');
        $this->assertStringStartsWith('PK', $epub->getContent());
    }

    public function test_docs_page_shows_bundle_export_formats(): void
    {
        $this->get('/docs/overview')
            ->assertOk()
            ->assertSee('/docs/export-all/pdf', false)
            ->assertSee('/docs/export-all/epub', false)
            ->assertDontSee('/docs/overview/export/pdf', false);
    }

    public function test_unknown_docs_slug_returns_404(): void
    {
        $this->get('/docs/not-a-real-page')->assertNotFound();
    }

    public function test_locale_prefixed_docs_work(): void
    {
        $this->get('/de/docs')
            ->assertRedirect('/de/docs/overview');

        $this->get('/de/docs/installation')
            ->assertOk()
            ->assertSee('Installation and setup', false);
    }

    public function test_sitemap_includes_docs_pages(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('/docs/overview', false)
            ->assertSee('/de/docs/overview', false)
            ->assertSee('/docs/getting-started', false)
            ->assertSee('/docs/identity-and-security', false);
    }

    public function test_relative_doc_links_are_localized(): void
    {
        $this->get('/de/docs/overview')
            ->assertOk()
            ->assertSee('href="http://localhost/de/docs/installation"', false)
            ->assertSee('href="http://localhost/de/docs/getting-started"', false);
    }
}
