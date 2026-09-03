<?php

namespace App\Console\Commands;

use App\Services\SbomService;
use Illuminate\Console\Command;

class WarmSbomCommand extends Command
{
    protected $signature = 'sbom:warm {--limit=8 : Max uncached SBOMs to fetch}';

    protected $description = 'Prefetch and cache CycloneDX SBOMs from GitHub releases';

    public function handle(SbomService $sbom): int
    {
        $limit = max(0, min((int) $this->option('limit'), 20));
        $warmed = $sbom->warmMissing($limit);
        $this->info("Warmed {$warmed} SBOM(s).");

        return self::SUCCESS;
    }
}
