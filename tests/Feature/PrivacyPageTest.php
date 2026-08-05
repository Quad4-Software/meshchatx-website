<?php

namespace Tests\Feature;

use Tests\TestCase;

class PrivacyPageTest extends TestCase
{
    public function test_privacy_page_states_no_tracking_and_functional_cookies(): void
    {
        $this->get('/privacy')
            ->assertOk()
            ->assertSee('No tracking, telemetry, or ads', false)
            ->assertSee('strictly functional', false)
            ->assertSee('do not run advertising', false)
            ->assertDontSee('Last updated: July 12, 2026', false);
    }
}
