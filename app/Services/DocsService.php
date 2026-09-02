<?php

namespace App\Services;

use App\Support\SafeHtml;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Str;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkExtension;
use League\CommonMark\MarkdownConverter;
use RuntimeException;
use ZipArchive;

class DocsService
{
    /**
     * @var array<string, array{slug: string, title: string, description: string, body: string, html: string, headings: list<array{id: string, text: string, level: int}>, path: string}>|null
     */
    private ?array $cache = null;

    public function defaultSlug(): string
    {
        return (string) config('meshchatx.documentation.default_slug', 'overview');
    }

    /**
     * @return list<array{label_key: string, items: list<array{slug: string, icon: string|null, title: string, href: string, active: bool}>}>
     */
    public function navigation(string $activeSlug = ''): array
    {
        $groups = config('meshchatx.documentation.groups', []);
        $nav = [];

        foreach ($groups as $group) {
            $items = [];
            foreach ($group['items'] ?? [] as $item) {
                $slug = (string) ($item['slug'] ?? '');
                if ($slug === '' || ! $this->exists($slug)) {
                    continue;
                }

                $doc = $this->get($slug);
                $items[] = [
                    'slug' => $slug,
                    'icon' => $item['icon'] ?? null,
                    'title' => $doc['title'],
                    'href' => locale_route('docs.show', ['slug' => $slug]),
                    'active' => $slug === $activeSlug,
                ];
            }

            if ($items === []) {
                continue;
            }

            $nav[] = [
                'label_key' => (string) ($group['label_key'] ?? ''),
                'items' => $items,
            ];
        }

        return $nav;
    }

    /**
     * @return list<array{slug: string, title: string, description: string, headings: list<string>, body: string, href: string}>
     */
    public function searchIndex(): array
    {
        $index = [];

        foreach ($this->all() as $doc) {
            $plain = trim(preg_replace('/\s+/', ' ', strip_tags($doc['html'])) ?? '');
            if (strlen($plain) > 6000) {
                $plain = substr($plain, 0, 6000);
            }

            $index[] = [
                'slug' => $doc['slug'],
                'title' => $doc['title'],
                'description' => $doc['description'],
                'href' => locale_route('docs.show', ['slug' => $doc['slug']]),
                'headings' => array_map(static fn (array $h): string => $h['text'], $doc['headings']),
                'body' => $plain,
            ];
        }

        return $index;
    }

    public function exportAllMarkdown(): string
    {
        $chunks = [];
        foreach ($this->orderedSlugs() as $slug) {
            $doc = $this->get($slug);
            $chunks[] = "# {$doc['title']}\n\n".$doc['body'];
        }

        return implode("\n\n---\n\n", $chunks)."\n";
    }

    public function exportAllPlainText(): string
    {
        $chunks = [];
        foreach ($this->orderedSlugs() as $slug) {
            $chunks[] = $this->plainText($slug);
        }

        return implode("\n\n".str_repeat('=', 72)."\n\n", $chunks);
    }

    public function exportAllPdf(): string
    {
        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->bundleHtmlDocument());
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return (string) $dompdf->output();
    }

    public function exportAllEpub(): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'mcx-docs-epub-');
        if ($tmp === false) {
            throw new RuntimeException('Could not create temporary EPUB file.');
        }

        $path = $tmp.'.epub';
        if (! @rename($tmp, $path)) {
            @unlink($tmp);
            throw new RuntimeException('Could not prepare temporary EPUB file.');
        }

        $zip = new ZipArchive;
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            @unlink($path);
            throw new RuntimeException('Could not open EPUB archive.');
        }

        try {
            $zip->addFromString('mimetype', 'application/epub+zip');
            $zip->setCompressionName('mimetype', ZipArchive::CM_STORE);

            $zip->addFromString('META-INF/container.xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
XML);

            $zip->addFromString('EPUB/styles.css', $this->bundleCss());
            $zip->addFromString('EPUB/nav.xhtml', $this->epubNavDocument());
            $zip->addFromString('EPUB/cover.xhtml', $this->epubCoverDocument());

            $manifest = [
                '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
                '    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>',
                '    <item id="css" href="styles.css" media-type="text/css"/>',
            ];
            $spine = [
                '    <itemref idref="cover"/>',
            ];

            foreach ($this->orderedSlugs() as $index => $slug) {
                $id = 'chap-'.($index + 1);
                $href = $id.'.xhtml';
                $zip->addFromString('EPUB/'.$href, $this->epubChapterDocument($slug));
                $manifest[] = '    <item id="'.$id.'" href="'.$href.'" media-type="application/xhtml+xml"/>';
                $spine[] = '    <itemref idref="'.$id.'"/>';
            }

            $manifestXml = implode("\n", $manifest);
            $spineXml = implode("\n", $spine);
            $modified = gmdate('Y-m-d\TH:i:s\Z');
            $uid = 'urn:uuid:'.Str::uuid()->toString();
            $title = 'MeshChatX Documentation';
            $language = e(app()->getLocale() ?: 'en');

            $zip->addFromString('EPUB/package.opf', <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0" xml:lang="{$language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">{$uid}</dc:identifier>
    <dc:title>{$title}</dc:title>
    <dc:language>{$language}</dc:language>
    <dc:creator>MeshChatX</dc:creator>
    <dc:publisher>MeshChatX</dc:publisher>
    <meta property="dcterms:modified">{$modified}</meta>
  </metadata>
  <manifest>
{$manifestXml}
  </manifest>
  <spine>
{$spineXml}
  </spine>
</package>
XML);

            $zip->close();

            $binary = (string) file_get_contents($path);
            @unlink($path);

            return $binary;
        } catch (\Throwable $e) {
            $zip->close();
            @unlink($path);
            throw $e;
        }
    }

    private function bundleHtmlDocument(): string
    {
        $sections = [];
        foreach ($this->orderedSlugs() as $slug) {
            $doc = $this->get($slug);
            $lead = $doc['description'] !== ''
                ? '<p class="lead">'.e($doc['description']).'</p>'
                : '';
            $sections[] = '<article id="'.e($slug).'">'
                .'<h1>'.e($doc['title']).'</h1>'
                .$lead
                .$this->exportableHtml($doc['html'])
                .'</article>';
        }

        $css = $this->bundleCss();
        $body = implode("\n", $sections);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MeshChatX Documentation</title>
<style>{$css}</style>
</head>
<body>
<header class="cover">
  <p class="cover-kicker">MeshChatX</p>
  <h1 class="cover-title">Documentation</h1>
  <p class="lead">Install, messaging, LXST calls, NomadNet, interfaces, and platform guides.</p>
</header>
{$body}
</body>
</html>
HTML;
    }

    private function bundleCss(): string
    {
        return <<<'CSS'
body {
  font-family: DejaVu Sans, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #18181b;
}
.cover {
  text-align: center;
  margin: 4rem 0 2rem;
  page-break-after: always;
}
.cover-kicker {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #52525b;
}
.cover-title {
  margin: 0;
  font-size: 28pt;
  letter-spacing: -0.03em;
}
.lead {
  color: #52525b;
  font-size: 1.02rem;
}
article {
  page-break-before: always;
}
article:first-of-type {
  page-break-before: auto;
}
h1 {
  font-size: 20pt;
  letter-spacing: -0.02em;
  margin: 0 0 0.6rem;
}
h2 {
  font-size: 14pt;
  margin: 1.4rem 0 0.55rem;
}
h3 {
  font-size: 12pt;
  margin: 1.15rem 0 0.45rem;
}
p, ul, ol {
  margin: 0.55rem 0;
}
a {
  color: #2563eb;
  text-decoration: none;
}
code, pre {
  font-family: DejaVu Sans Mono, monospace;
  font-size: 9pt;
}
code {
  background: #f4f4f5;
  padding: 0.05rem 0.25rem;
}
pre {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  padding: 0.7rem 0.8rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}
pre code {
  background: transparent;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8rem 0;
  font-size: 10pt;
}
th, td {
  border: 1px solid #d4d4d8;
  padding: 0.35rem 0.45rem;
  text-align: left;
  vertical-align: top;
}
th {
  background: #f4f4f5;
}
blockquote {
  margin: 0.8rem 0;
  padding: 0.1rem 0 0.1rem 0.8rem;
  border-left: 3px solid #2563eb;
  color: #52525b;
}
CSS;
    }

    private function exportableHtml(string $html): string
    {
        $html = (string) preg_replace(
            '/<a\b[^>]*class="docs-heading-link"[^>]*>.*?<\/a>/is',
            '',
            $html,
        );

        return $html;
    }

    private function epubCoverDocument(): string
    {
        return $this->epubWrap(
            'MeshChatX Documentation',
            <<<'HTML'
<header class="cover">
  <p class="cover-kicker">MeshChatX</p>
  <h1 class="cover-title">Documentation</h1>
  <p class="lead">Install, messaging, LXST calls, NomadNet, interfaces, and platform guides.</p>
</header>
HTML
        );
    }

    private function epubNavDocument(): string
    {
        $items = [];
        foreach ($this->orderedSlugs() as $index => $slug) {
            $doc = $this->get($slug);
            $href = 'chap-'.($index + 1).'.xhtml';
            $items[] = '        <li><a href="'.e($href).'">'.e($doc['title']).'</a></li>';
        }

        $list = implode("\n", $items);

        return $this->epubWrap(
            'Contents',
            <<<HTML
<nav epub:type="toc" id="toc" role="doc-toc">
  <h1>Contents</h1>
  <ol>
{$list}
  </ol>
</nav>
HTML
            ,
            withEpubNs: true,
        );
    }

    private function epubChapterDocument(string $slug): string
    {
        $doc = $this->get($slug);
        $lead = $doc['description'] !== ''
            ? '<p class="lead">'.e($doc['description']).'</p>'
            : '';
        $body = $lead.$this->xhtmlFragment($this->exportableHtml($doc['html']));

        return $this->epubWrap($doc['title'], '<h1>'.e($doc['title']).'</h1>'.$body);
    }

    private function epubWrap(string $title, string $body, bool $withEpubNs = false): string
    {
        $epubNs = $withEpubNs ? ' xmlns:epub="http://www.idpf.org/2007/ops"' : '';

        return <<<XHTML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"{$epubNs} xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>{$this->xmlEscape($title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
{$body}
</body>
</html>
XHTML;
    }

    private function xhtmlFragment(string $html): string
    {
        $wrapped = '<!DOCTYPE html><html><body>'.$html.'</body></html>';
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $dom->loadHTML($wrapped, LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $dom->getElementsByTagName('body')->item(0);
        if ($body === null) {
            return $html;
        }

        $fragment = '';
        foreach ($body->childNodes as $child) {
            $fragment .= $dom->saveXML($child);
        }

        return $fragment;
    }

    private function xmlEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    /**
     * @return list<string>
     */
    public function slugs(): array
    {
        return array_keys($this->all());
    }

    public function exists(string $slug): bool
    {
        return array_key_exists($slug, $this->all());
    }

    /**
     * @return array{slug: string, title: string, description: string, body: string, html: string, headings: list<array{id: string, text: string, level: int}>, path: string, prev: ?array{slug: string, title: string}, next: ?array{slug: string, title: string}}
     */
    public function page(string $slug): array
    {
        $doc = $this->get($slug);
        $order = $this->orderedSlugs();
        $index = array_search($slug, $order, true);
        $prev = null;
        $next = null;

        if ($index !== false) {
            if ($index > 0) {
                $prevSlug = $order[$index - 1];
                $prevDoc = $this->get($prevSlug);
                $prev = ['slug' => $prevSlug, 'title' => $prevDoc['title']];
            }
            if ($index < count($order) - 1) {
                $nextSlug = $order[$index + 1];
                $nextDoc = $this->get($nextSlug);
                $next = ['slug' => $nextSlug, 'title' => $nextDoc['title']];
            }
        }

        return array_merge($doc, [
            'prev' => $prev,
            'next' => $next,
        ]);
    }

    public function rawMarkdown(string $slug): string
    {
        $doc = $this->get($slug);

        return (string) file_get_contents($doc['path']);
    }

    public function plainText(string $slug): string
    {
        $doc = $this->get($slug);
        $text = $doc['title']."\n\n";
        if ($doc['description'] !== '') {
            $text .= $doc['description']."\n\n";
        }
        $text .= trim(strip_tags($doc['html']))."\n";

        return $text;
    }

    /**
     * @return array{slug: string, title: string, description: string, body: string, html: string, headings: list<array{id: string, text: string, level: int}>, path: string}
     */
    public function get(string $slug): array
    {
        $all = $this->all();
        if (! isset($all[$slug])) {
            throw new RuntimeException('Unknown docs slug: '.$slug);
        }

        return $all[$slug];
    }

    /**
     * @return array<string, array{slug: string, title: string, description: string, body: string, html: string, headings: list<array{id: string, text: string, level: int}>, path: string}>
     */
    public function all(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $docs = [];
        foreach ($this->configuredSlugs() as $slug) {
            $path = $this->resolvePath($slug);
            if ($path === null) {
                continue;
            }

            $raw = (string) file_get_contents($path);
            [$meta, $body] = $this->parseFrontMatter($raw);
            $html = $this->rewriteLinks($this->renderMarkdown($body), $this->configuredSlugs());
            $headings = $this->extractHeadings($html);
            $title = (string) ($meta['title'] ?? Str::headline($slug));
            $description = (string) ($meta['description'] ?? '');

            $docs[$slug] = [
                'slug' => $slug,
                'title' => $title,
                'description' => $description,
                'body' => $body,
                'html' => $html,
                'headings' => $headings,
                'path' => $path,
            ];
        }

        return $this->cache = $docs;
    }

    /**
     * @return list<string>
     */
    private function orderedSlugs(): array
    {
        $slugs = [];
        foreach ($this->configuredSlugs() as $slug) {
            if ($this->exists($slug)) {
                $slugs[] = $slug;
            }
        }

        return $slugs;
    }

    /**
     * @return list<string>
     */
    private function configuredSlugs(): array
    {
        $slugs = [];
        foreach (config('meshchatx.documentation.groups', []) as $group) {
            foreach ($group['items'] ?? [] as $item) {
                $slug = (string) ($item['slug'] ?? '');
                if ($slug !== '' && ! in_array($slug, $slugs, true)) {
                    $slugs[] = $slug;
                }
            }
        }

        return $slugs;
    }

    private function resolvePath(string $slug): ?string
    {
        $base = (string) config('meshchatx.documentation.content_path', base_path('content/docs'));
        $locale = app()->getLocale();
        $default = (string) config('meshchatx.default_locale', 'en');
        $candidates = [
            $base.DIRECTORY_SEPARATOR.$locale.DIRECTORY_SEPARATOR.$slug.'.md',
            $base.DIRECTORY_SEPARATOR.$default.DIRECTORY_SEPARATOR.$slug.'.md',
            $base.DIRECTORY_SEPARATOR.$slug.'.md',
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * @return array{0: array<string, string>, 1: string}
     */
    private function parseFrontMatter(string $raw): array
    {
        if (! preg_match('/\A---\r?\n(.*?)\r?\n---\r?\n(.*)\z/s', $raw, $matches)) {
            return [[], ltrim($raw)];
        }

        $meta = [];
        foreach (preg_split('/\r?\n/', $matches[1]) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || ! str_contains($line, ':')) {
                continue;
            }
            [$key, $value] = explode(':', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            if ($key !== '') {
                $meta[$key] = $value;
            }
        }

        return [$meta, ltrim($matches[2])];
    }

    private function renderMarkdown(string $markdown): string
    {
        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'heading_permalink' => [
                'html_class' => 'docs-heading-link',
                'id_prefix' => '',
                'fragment_prefix' => '',
                'apply_id_to_heading' => true,
                'insert' => 'after',
                'symbol' => '#',
                'title' => 'Permalink',
                'min_heading_level' => 2,
                'max_heading_level' => 3,
            ],
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addExtension(new GithubFlavoredMarkdownExtension);
        $environment->addExtension(new HeadingPermalinkExtension);

        $converter = new MarkdownConverter($environment);
        $html = (string) $converter->convert($markdown);

        return SafeHtml::sanitize($html);
    }

    /**
     * @param  list<string>  $knownSlugs
     */
    private function rewriteLinks(string $html, array $knownSlugs): string
    {
        $sitePages = ['download', 'roadmap', 'interfaces', 'branding', 'contact', 'donate', 'license', 'privacy', 'git'];

        return (string) preg_replace_callback(
            '/href="([^"]+)"/',
            function (array $match) use ($sitePages, $knownSlugs): string {
                $href = html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://') || str_starts_with($href, 'mailto:') || str_starts_with($href, '#')) {
                    return $match[0];
                }

                $fragment = '';
                if (str_contains($href, '#')) {
                    [$href, $fragmentPart] = explode('#', $href, 2);
                    $fragment = '#'.$fragmentPart;
                }

                if (preg_match('/\A\/docs\/([a-z0-9\-]+)\z/', $href, $docsMatch) === 1) {
                    return 'href="'.e(locale_route('docs.show', ['slug' => $docsMatch[1]]).$fragment).'"';
                }

                if (preg_match('/\A([a-z0-9\-]+)\z/', $href, $slugMatch) === 1 && in_array($slugMatch[1], $knownSlugs, true)) {
                    return 'href="'.e(locale_route('docs.show', ['slug' => $slugMatch[1]]).$fragment).'"';
                }

                if (preg_match('/\A\/([a-z0-9\-]+)\z/', $href, $pageMatch) === 1 && in_array($pageMatch[1], $sitePages, true)) {
                    return 'href="'.e(locale_route($pageMatch[1]).$fragment).'"';
                }

                return $match[0];
            },
            $html,
        );
    }

    /**
     * @return list<array{id: string, text: string, level: int}>
     */
    private function extractHeadings(string $html): array
    {
        $headings = [];
        if (! preg_match_all(
            '/<h([2-3])\b[^>]*\bid="([^"]+)"[^>]*>(.*?)<\/h\1>/is',
            $html,
            $matches,
            PREG_SET_ORDER,
        )) {
            return $headings;
        }

        foreach ($matches as $match) {
            $text = trim(html_entity_decode(strip_tags($match[3]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $text = trim(str_replace('#', '', $text));
            if ($text === '') {
                continue;
            }
            $headings[] = [
                'id' => html_entity_decode($match[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'text' => $text,
                'level' => (int) $match[1],
            ];
        }

        return $headings;
    }
}
