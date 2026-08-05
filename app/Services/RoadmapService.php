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
