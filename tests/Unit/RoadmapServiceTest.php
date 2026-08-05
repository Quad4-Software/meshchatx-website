<?php

namespace Tests\Unit;

use App\Services\RoadmapService;
use Tests\TestCase;

class RoadmapServiceTest extends TestCase
{
    public function test_marks_milestones_done_when_exact_or_later_stable_shipped(): void
    {
        $items = app(RoadmapService::class)->items(['4.8.1']);

        $this->assertSame('done', $items[0]['status']);
        $this->assertSame('4.7.0', $items[0]['version']);
        $this->assertSame('done', $items[1]['status']);
        $this->assertSame('4.8.0', $items[1]['version']);
        $this->assertSame('upcoming', $items[2]['status']);
        $this->assertSame('4.9.0', $items[2]['version']);
        $this->assertSame('planned', $items[3]['status']);
        $this->assertSame('5.0.0', $items[3]['version']);
    }

    public function test_exact_match_still_marks_done(): void
    {
        $items = app(RoadmapService::class)->items(['4.7.0']);

        $this->assertSame('done', $items[0]['status']);
        $this->assertSame('upcoming', $items[1]['status']);
        $this->assertSame('planned', $items[2]['status']);
    }

    public function test_empty_published_list_marks_first_as_upcoming(): void
    {
        $items = app(RoadmapService::class)->items([]);

        $this->assertSame('upcoming', $items[0]['status']);
        $this->assertSame('planned', $items[1]['status']);
    }
}
