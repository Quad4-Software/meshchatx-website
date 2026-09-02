<?php

namespace App\Services;

use App\Support\SafeHtml;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;

class ChangelogService
{
    private const CACHE_RAW = 'meshchatx.changelog.raw';

    private const CACHE_RAW_STALE = 'meshchatx.changelog.raw.stale';

    private const CACHE_ENTRIES = 'meshchatx.changelog.entries';

    /**
     * @return list<array{
     *   version: string,
     *   date: string,
     *   released: bool,
     *   status: ?string,
     *   body: string,
     *   html: string,
     *   summary: list<string>,
     *   anchor: string
     * }>
     */
    public function entries(): array
    {
        return Cache::remember(self::CACHE_ENTRIES, $this->cacheTtl(), function () {
            return $this->parse($this->rawMarkdown());
        });
    }

    /**
     * Lightweight TOC rows (no HTML bodies).
     *
     * @return list<array{version: string, date: string, released: bool, anchor: string}>
     */
    public function toc(): array
    {
        $rows = [];
        foreach ($this->entries() as $entry) {
            $rows[] = [
                'version' => $entry['version'],
                'date' => $entry['date'],
                'released' => $entry['released'],
                'anchor' => $entry['anchor'],
            ];
        }

        return $rows;
    }

    public function perPage(): int
    {
        return max(1, min((int) config('meshchatx.changelog_per_page', 10), 50));
    }

    public function rssLimit(): int
    {
        return max(1, min((int) config('meshchatx.changelog_rss_limit', 40), 100));
    }

    /**
     * @return array{
     *   entries: list<array{
     *     version: string,
     *     date: string,
     *     released: bool,
     *     status: ?string,
     *     body: string,
     *     html: string,
     *     summary: list<string>,
     *     anchor: string
     *   }>,
     *   page: int,
     *   per_page: int,
     *   total: int,
     *   total_pages: int,
     *   has_more: bool,
     *   next_page: ?int
     * }
     */
    public function page(int $page): array
    {
        $all = $this->entries();
        $perPage = $this->perPage();
        $total = count($all);
        $totalPages = max(1, (int) ceil($total / $perPage));
        $page = max(1, min($page, $totalPages));
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($all, $offset, $perPage);
        $hasMore = $page < $totalPages;

        return [
            'entries' => $slice,
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $hasMore,
            'next_page' => $hasMore ? $page + 1 : null,
        ];
    }

    /**
     * Entries spanning inclusive page range.
     *
     * @return array{
     *   entries: list<array{
     *     version: string,
     *     date: string,
     *     released: bool,
     *     status: ?string,
     *     body: string,
     *     html: string,
     *     summary: list<string>,
     *     anchor: string
     *   }>,
     *   page: int,
     *   per_page: int,
     *   total: int,
     *   total_pages: int,
     *   has_more: bool,
     *   next_page: ?int
     * }
     */
    public function pageRange(int $fromPage, int $toPage): array
    {
        $all = $this->entries();
        $perPage = $this->perPage();
        $total = count($all);
        $totalPages = max(1, (int) ceil($total / $perPage));
        if ($total === 0) {
            $totalPages = 1;
        }

        $fromPage = max(1, min($fromPage, $totalPages));
        $toPage = max($fromPage, min($toPage, $totalPages));
        $offset = ($fromPage - 1) * $perPage;
        $length = ($toPage - $fromPage + 1) * $perPage;
        $slice = array_slice($all, $offset, $length);
        $hasMore = $toPage < $totalPages;

        return [
            'entries' => $slice,
            'page' => $toPage,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $hasMore,
            'next_page' => $hasMore ? $toPage + 1 : null,
        ];
    }

    public function pageForAnchor(string $anchor): ?int
    {
        $anchor = $this->normalizeAnchor($anchor);
        if ($anchor === '') {
            return null;
        }

        $all = $this->entries();
        foreach ($all as $index => $entry) {
            if ($entry['anchor'] === $anchor) {
                return intdiv($index, $this->perPage()) + 1;
            }
        }

        return null;
    }

    /**
     * Released entries only, newest first (same order as source).
     *
     * @return list<array{
     *   version: string,
     *   date: string,
     *   released: bool,
     *   status: ?string,
     *   body: string,
     *   html: string,
     *   summary: list<string>,
     *   anchor: string
     * }>
     */
    public function releasedEntries(?int $limit = null): array
    {
        $entries = array_values(array_filter(
            $this->entries(),
            static fn (array $entry): bool => $entry['released'] === true,
        ));

        if ($limit !== null) {
            return array_slice($entries, 0, max(0, $limit));
        }

        return $entries;
    }

    /**
     * @return array<string, array{
     *   version: string,
     *   date: string,
     *   released: bool,
     *   status: ?string,
     *   body: string,
     *   html: string,
     *   summary: list<string>,
     *   anchor: string
     * }>
     */
    public function releasedByVersion(): array
    {
        $map = [];
        foreach ($this->releasedEntries() as $entry) {
            $map[$entry['version']] = $entry;
        }

        return $map;
    }

    public function rawMarkdown(): string
    {
        $ttl = $this->cacheTtl();
        $cached = Cache::get(self::CACHE_RAW);
        if (is_string($cached)) {
            return $cached;
        }

        $fresh = $this->fetchMarkdown();
        if ($fresh !== '') {
            Cache::put(self::CACHE_RAW, $fresh, $ttl);
            Cache::put(self::CACHE_RAW_STALE, $fresh, max($ttl * 12, 43200));

            return $fresh;
        }

        $stale = Cache::get(self::CACHE_RAW_STALE);
        if (is_string($stale) && $stale !== '') {
            Cache::put(self::CACHE_RAW, $stale, min(300, $ttl));

            return $stale;
        }

        Cache::put(self::CACHE_RAW, '', 60);

        return '';
    }

    private function cacheTtl(): int
    {
        return max(60, min((int) config('meshchatx.changelog_cache_seconds', 3600), 86400));
    }

    private function fetchMarkdown(): string
    {
        $url = (string) config(
            'meshchatx.github_changelog_raw',
            'https://raw.githubusercontent.com/Quad4-Software/MeshChatX/master/CHANGELOG.md',
        );

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'meshchatx-website',
                    'Accept' => 'text/plain, text/markdown, */*',
                ])
                ->get($url);

            if (! $response->successful()) {
                return '';
            }

            $body = trim((string) $response->body());

            return str_starts_with($body, '#') ? $body : '';
        } catch (\Throwable) {
            return '';
        }
    }

    /**
     * @return list<array{
     *   version: string,
     *   date: string,
     *   released: bool,
     *   status: ?string,
     *   body: string,
     *   html: string,
     *   summary: list<string>,
     *   anchor: string
     * }>
     */
    private function parse(string $markdown): array
    {
        if ($markdown === '') {
            return [];
        }

        if (! preg_match_all(
            '/^## \[([0-9A-Za-z][0-9A-Za-z._+-]{0,63})\] - (\d{4}-\d{2}-\d{2})(?:\s+\[(released|unreleased)\])?\s*$/m',
            $markdown,
            $matches,
            PREG_OFFSET_CAPTURE,
        )) {
            return [];
        }

        $entries = [];
        $count = count($matches[0]);

        for ($i = 0; $i < $count; $i++) {
            $version = trim($matches[1][$i][0]);
            $date = $matches[2][$i][0];
            $status = isset($matches[3][$i][0]) && $matches[3][$i][0] !== ''
                ? $matches[3][$i][0]
                : null;
            $headerEnd = $matches[0][$i][1] + strlen($matches[0][$i][0]);
            $nextStart = $i + 1 < $count ? $matches[0][$i + 1][1] : strlen($markdown);
            $body = trim(substr($markdown, $headerEnd, $nextStart - $headerEnd));

            $entries[] = [
                'version' => $version,
                'date' => $date,
                'released' => $status !== 'unreleased',
                'status' => $status,
                'body' => $body,
                'html' => $this->renderMarkdown($body),
                'summary' => $this->summarize($body),
                'anchor' => $this->anchorForVersion($version),
            ];
        }

        return $entries;
    }

    public function anchorForVersion(string $version): string
    {
        $safe = preg_replace('/[^0-9A-Za-z]+/', '-', $version) ?? '';
        $safe = trim($safe, '-');

        return $safe === '' ? 'v-unknown' : 'v-'.strtolower($safe);
    }

    private function normalizeAnchor(string $anchor): string
    {
        $anchor = trim($anchor);
        if ($anchor === '' || ! preg_match('/\Av-[0-9a-z]+(?:-[0-9a-z]+)*\z/', $anchor)) {
            return '';
        }

        return $anchor;
    }

    /**
     * @return list<string>
     */
    private function summarize(string $body, int $limit = 4): array
    {
        $lines = preg_split('/\r?\n/', $body) ?: [];
        $bullets = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (! str_starts_with($line, '- ')) {
                continue;
            }

            $text = trim(html_entity_decode(strip_tags(
                preg_replace('/\*\*([^*]+)\*\*/', '$1', substr($line, 2)) ?? substr($line, 2),
            ), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

            if ($text === '') {
                continue;
            }

            if (strlen($text) > 140) {
                $text = rtrim(substr($text, 0, 137)).'...';
            }

            $bullets[] = $text;
            if (count($bullets) >= $limit) {
                break;
            }
        }

        return $bullets;
    }

    private function renderMarkdown(string $markdown): string
    {
        if ($markdown === '') {
            return '';
        }

        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addExtension(new GithubFlavoredMarkdownExtension);

        $html = (string) (new MarkdownConverter($environment))->convert($markdown);

        return SafeHtml::sanitize($html);
    }
}
