<?php

namespace App\Services;

class RoadmapService
{
    /**
     * @param  list<string>  $publishedVersions
     * @return list<array<string, mixed>>
     */
    public function items(array $publishedVersions): array
    {
        $items = config('meshchatx.roadmap', []);
        $resolved = [];
        $markedUpcoming = false;

        foreach ($items as $item) {
            $status = $item['status'] ?? 'planned';
            $version = (string) ($item['version'] ?? '');

            if ($status === 'planned' && $this->isReleased($version, $publishedVersions)) {
                $status = 'done';
            } elseif ($status === 'planned' && ! $markedUpcoming) {
                $status = 'upcoming';
                $markedUpcoming = true;
            }

            $item['status'] = $status;
            $resolved[] = $item;
        }

        return $resolved;
    }

    /**
     * Milestone nodes plus released patch versions between them for the top rail.
     *
     * @param  list<array<string, mixed>>  $milestones
     * @param  list<string>  $publishedVersions
     * @param  array<string, array{version: string, date: string, summary: list<string>, anchor: string}>  $changelogByVersion
     * @return list<array{
     *   type: string,
     *   version: string,
     *   status: string,
     *   date: string,
     *   label: string,
     *   href: string,
     *   preview: ?array{title: string, date: string, bullets: list<string>, href: string}
     * }>
     */
    public function rail(array $milestones, array $publishedVersions, array $changelogByVersion = []): array
    {
        $milestoneVersions = [];
        foreach ($milestones as $item) {
            $version = (string) ($item['version'] ?? '');
            if ($version !== '') {
                $milestoneVersions[] = $version;
            }
        }

        $patches = array_values(array_filter(
            $publishedVersions,
            static function (string $version) use ($milestoneVersions, $changelogByVersion): bool {
                if (in_array($version, $milestoneVersions, true)) {
                    return false;
                }
                if (! preg_match('/^\d+\.\d+\.\d+$/', $version)) {
                    return false;
                }
                $entry = $changelogByVersion[$version] ?? null;
                if ($entry !== null && ($entry['released'] ?? true) === false) {
                    return false;
                }

                return true;
            },
        ));

        usort($patches, static fn (string $a, string $b): int => version_compare($a, $b));

        $rail = [];
        $count = count($milestones);

        for ($i = 0; $i < $count; $i++) {
            $item = $milestones[$i];
            $version = (string) ($item['version'] ?? '');
            $status = (string) ($item['status'] ?? 'planned');
            $short = preg_replace('/^(\d+\.\d+).*$/', '$1', $version) ?: $version;
            $anchor = 'v-'.str_replace('.', '-', $version);
            $changelog = $changelogByVersion[$version] ?? null;

            $rail[] = [
                'type' => 'milestone',
                'version' => $version,
                'status' => $status,
                'date' => (string) ($item['date'] ?? ''),
                'label' => 'v'.$short,
                'href' => '#'.$anchor,
                'preview' => $this->previewFromChangelog($changelog, $version),
            ];

            $nextMilestone = $milestones[$i + 1]['version'] ?? null;
            foreach ($patches as $patch) {
                if (version_compare($patch, $version, '<=')) {
                    continue;
                }
                if (is_string($nextMilestone) && version_compare($patch, (string) $nextMilestone, '>=')) {
                    continue;
                }

                $entry = $changelogByVersion[$patch] ?? null;
                $patchAnchor = 'v-'.str_replace('.', '-', $patch);
                $href = locale_route('changelog').'#'.$patchAnchor;

                $rail[] = [
                    'type' => 'patch',
                    'version' => $patch,
                    'status' => 'released',
                    'date' => is_array($entry) ? (string) ($entry['date'] ?? '') : '',
                    'label' => 'v'.$patch,
                    'href' => $href,
                    'preview' => $this->previewFromChangelog($entry, $patch, $href),
                ];
            }
        }

        return $rail;
    }

    /**
     * @param  list<array{status: string}>  $rail
     */
    public function railProgress(array $rail): float
    {
        if ($rail === []) {
            return 0.0;
        }

        $lastFilled = -1;
        foreach ($rail as $index => $node) {
            $status = $node['status'] ?? '';
            $type = $node['type'] ?? '';
            if ($status === 'done' || $type === 'patch' || $status === 'released') {
                $lastFilled = $index;
            }
        }

        if (count($rail) === 1) {
            return $lastFilled >= 0 ? 100.0 : 0.0;
        }

        return max(0, $lastFilled) / (count($rail) - 1) * 100;
    }

    /**
     * @param  ?array{version?: string, date?: string, summary?: list<string>, anchor?: string, released?: bool}  $entry
     * @return ?array{title: string, date: string, bullets: list<string>, href: string}
     */
    private function previewFromChangelog(?array $entry, string $version, ?string $href = null): ?array
    {
        if ($entry === null || ($entry['released'] ?? true) === false) {
            return null;
        }

        $bullets = $entry['summary'] ?? [];
        if ($bullets === []) {
            return null;
        }

        $anchor = (string) ($entry['anchor'] ?? ('v-'.str_replace('.', '-', $version)));

        return [
            'title' => 'v'.$version,
            'date' => (string) ($entry['date'] ?? ''),
            'bullets' => $bullets,
            'href' => $href ?? (locale_route('changelog').'#'.$anchor),
        ];
    }

    /**
     * A roadmap milestone is done when that tag shipped, or any later stable release did.
     *
     * @param  list<string>  $publishedVersions
     */
    private function isReleased(string $version, array $publishedVersions): bool
    {
        if ($version === '' || $publishedVersions === []) {
            return false;
        }

        foreach ($publishedVersions as $published) {
            if ($published === $version || version_compare($published, $version, '>=')) {
                return true;
            }
        }

        return false;
    }
}
