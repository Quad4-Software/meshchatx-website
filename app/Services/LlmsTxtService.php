<?php

namespace App\Services;

use App\Support\SiteUri;

class LlmsTxtService
{
    public function __construct(private readonly DocsService $docs) {}

    public function siteIndex(): string
    {
        $domain = $this->domain();
        $lines = [
            '# MeshChatX',
            '',
            '> MeshChatX is an all-in-one Reticulum client for LXMF messaging, LXST voice calls, NomadNet browsing, and related tools. This site is the public marketing site and documentation for MeshChatX at '.$domain.'.',
            '',
            'Important notes:',
            '',
            '- MeshChatX does not operate central message servers. Traffic goes over Reticulum links the user configures.',
            '- Prefer markdown URLs ending in `.md` or the bulk export at `/docs/export-all/md` when reading docs.',
            '- rngit over Reticulum is the canonical source tree. GitHub and LavaForge are clearnet mirrors for CI and releases.',
            '- Official application repository: '.$this->absolute(config('meshchatx.github_url')).'.',
            '- Cryptography primitives are documented by Reticulum at '.$this->absolute(config('meshchatx.reticulum_crypto')).'.',
            '',
            '## Documentation',
            '',
        ];

        foreach ($this->docLinks() as $link) {
            $lines[] = $link;
        }

        $lines = array_merge($lines, [
            '',
            '## Machine-readable',
            '',
            '- [Full docs markdown]('.$domain.'/docs/export-all/md): Every documentation page in one markdown file.',
            '- [llms-full.txt]('.$domain.'/llms-full.txt): This index plus the full documentation text.',
            '- [Docs llms.txt]('.$domain.'/docs/llms.txt): Documentation-only agent index.',
            '- [Releases API]('.$domain.'/api/mcx-releases): Stable, beta, and testing download assets as JSON.',
            '- [Interfaces API]('.$domain.'/api/mcx-interfaces): Reticulum interface directory snapshot as JSON.',
            '- [SBOM API]('.$domain.'/api/mcx-sbom): CycloneDX software bill of materials catalog and per-version payloads.',
            '- [Sitemap]('.$domain.'/sitemap.xml): All public HTML pages and locales.',
            '',
            '## Site',
            '',
            '- [Download]('.$domain.'/download): Installers, packages, and container images.',
            '- [Roadmap]('.$domain.'/roadmap): Near-term product plan.',
            '- [Changelog]('.$domain.'/changelog): Release history mirrored from the app repository.',
            '- [Interfaces]('.$domain.'/interfaces): Public Reticulum interface directory browser.',
            '- [Dependencies]('.$domain.'/dependency): SBOM browser for release builds.',
            '- [Git]('.$domain.'/git): Clone URLs for rngit, GitHub, and LavaForge.',
            '',
            '## Optional',
            '',
            '- [Contact]('.$domain.'/contact): LXMF and email.',
            '- [Donate]('.$domain.'/donate): Ko-fi, Buy Me a Coffee, and Monero.',
            '- [Branding]('.$domain.'/branding): Logos and usage.',
            '- [License]('.$domain.'/license): Website and product licensing notes.',
            '- [Privacy]('.$domain.'/privacy): No tracking, no ads, functional cookies only.',
            '',
        ]);

        return implode("\n", $lines);
    }

    public function docsIndex(): string
    {
        $domain = $this->domain();
        $lines = [
            '# MeshChatX documentation',
            '',
            '> Official MeshChatX guides mirrored from the application docs bundle. Prefer `.md` URLs for clean text.',
            '',
            'These pages cover install, messaging, LXST calls, NomadNet, interfaces, plugins, and platform setups. HTML lives under `/docs/{slug}`. Markdown is at `/docs/{slug}.md`.',
            '',
            '## Pages',
            '',
        ];

        foreach ($this->docLinks() as $link) {
            $lines[] = $link;
        }

        $lines = array_merge($lines, [
            '',
            '## Bundles',
            '',
            '- [All docs (markdown)]('.$domain.'/docs/export-all/md)',
            '- [All docs (plain text)]('.$domain.'/docs/export-all/txt)',
            '- [Site llms.txt]('.$domain.'/llms.txt)',
            '- [llms-full.txt]('.$domain.'/llms-full.txt)',
            '',
        ]);

        return implode("\n", $lines);
    }

    public function fullText(): string
    {
        return $this->siteIndex()
            ."\n---\n\n"
            ."# Full documentation\n\n"
            .$this->docs->exportAllMarkdown();
    }

    public function markdownUrl(string $slug): string
    {
        return $this->domain().'/docs/'.$slug.'.md';
    }

    /**
     * @return list<string>
     */
    private function docLinks(): array
    {
        $links = [];
        foreach ($this->docs->slugs() as $slug) {
            if (! $this->docs->exists($slug)) {
                continue;
            }

            $doc = $this->docs->get($slug);
            $url = $this->markdownUrl($slug);
            $note = $doc['description'] !== '' ? $doc['description'] : $doc['title'];
            $links[] = '- ['.$doc['title'].']('.$url.'): '.$note;
        }

        return $links;
    }

    private function domain(): string
    {
        $raw = (string) config('meshchatx.domain');
        $normalized = SiteUri::normalize($raw);

        return $normalized ?? rtrim($raw, '/');
    }

    private function absolute(mixed $url): string
    {
        $value = is_string($url) ? $url : '';
        $normalized = SiteUri::normalize($value);

        return $normalized ?? rtrim($value, '/');
    }
}
