<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class LayoutOverflowTest extends TestCase
{
    /**
     * @return array<string, array{width: int, height: int, burgerVisible: bool}>
     */
    public static function viewports(): array
    {
        return [
            'phone' => ['width' => 390, 'height' => 844, 'burgerVisible' => true],
            'phone-se' => ['width' => 360, 'height' => 780, 'burgerVisible' => true],
            'tablet' => ['width' => 768, 'height' => 1024, 'burgerVisible' => true],
            'desktop' => ['width' => 1280, 'height' => 900, 'burgerVisible' => false],
        ];
    }

    #[DataProvider('viewports')]
    public function test_home_does_not_overflow_viewport(int $width, int $height, bool $burgerVisible): void
    {
        if (! is_executable('/usr/bin/chromium')) {
            $this->markTestSkipped('Chromium is required for layout overflow checks.');
        }

        $response = $this->get('/');
        $response->assertOk();

        $html = $response->getContent();
        $this->assertIsString($html);

        $css = file_get_contents(resource_path('css/app.css'));
        $this->assertIsString($css);

        $document = preg_replace(
            '#<script[^>]*type=["\']module["\'][^>]*>.*?</script>#si',
            '',
            $html,
        ) ?? $html;
        $document = preg_replace(
            '#<link[^>]+rel=["\']stylesheet["\'][^>]*>#si',
            '',
            $document,
        ) ?? $document;
        $document = str_replace(
            '</head>',
            '<style>'.$css.'</style></head>',
            $document,
        );

        $probe = <<<'HTML'
<script id="layout-overflow-probe">
(() => {
  const main = document.querySelector('main');
  const shell = document.querySelector('.site-shell');
  const bg = document.querySelector('.home-hero__bg-img');
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('[data-menu-toggle]');
  const metrics = {
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    mainWidth: main ? Math.round(main.getBoundingClientRect().width) : null,
    shellWidth: shell ? Math.round(shell.getBoundingClientRect().width) : null,
    headerWidth: header ? Math.round(header.getBoundingClientRect().width) : null,
    headerRight: header ? Math.round(header.getBoundingClientRect().right) : null,
    toggleDisplay: toggle ? getComputedStyle(toggle).display : null,
    bgRight: bg ? Math.round(bg.getBoundingClientRect().right) : null,
  };
  const node = document.createElement('pre');
  node.id = 'layout-metrics';
  node.textContent = JSON.stringify(metrics);
  document.body.appendChild(node);
})();
</script>
HTML;

        $document = str_replace('</body>', $probe.'</body>', $document);

        $tmp = tempnam(sys_get_temp_dir(), 'mcx-layout-');
        $this->assertNotFalse($tmp);
        $htmlPath = $tmp.'.html';
        rename($tmp, $htmlPath);
        file_put_contents($htmlPath, $document);

        try {
            $process = new Process([
                '/usr/bin/chromium',
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--allow-file-access-from-files',
                '--window-size='.$width.','.$height,
                '--virtual-time-budget=4000',
                '--dump-dom',
                'file://'.$htmlPath,
            ], null, null, null, 60);
            $process->run();

            if (! $process->isSuccessful()) {
                $this->markTestSkipped('Chromium layout probe failed: '.$process->getErrorOutput());
            }

            $dom = $process->getOutput();
            $this->assertMatchesRegularExpression(
                '/<pre id="layout-metrics">(\{.*?\})<\/pre>/s',
                $dom,
                'layout metrics probe missing from chromium dump',
            );

            preg_match('/<pre id="layout-metrics">(\{.*?\})<\/pre>/s', $dom, $match);
            /** @var array{clientWidth:int,scrollWidth:int,bodyScrollWidth:int,mainWidth:?int,shellWidth:?int,headerWidth:?int,headerRight:?int,toggleDisplay:?string,bgRight:?int} $metrics */
            $metrics = json_decode($match[1], true, 512, JSON_THROW_ON_ERROR);

            $this->assertSame(
                $metrics['clientWidth'],
                $metrics['scrollWidth'],
                'documentElement scrollWidth must equal clientWidth at '.$width.'px',
            );
            $this->assertLessThanOrEqual(
                $metrics['clientWidth'] + 1,
                $metrics['bodyScrollWidth'],
                'body must not expand past the viewport at '.$width.'px',
            );
            $this->assertNotNull($metrics['mainWidth']);
            $this->assertLessThanOrEqual(
                $metrics['clientWidth'] + 1,
                (int) $metrics['mainWidth'],
                'main must not expand past the viewport at '.$width.'px',
            );
            $this->assertNotNull($metrics['headerWidth']);
            $this->assertLessThanOrEqual(
                $metrics['clientWidth'] + 1,
                (int) $metrics['headerWidth'],
                'header must not expand past the viewport at '.$width.'px',
            );
            if ($metrics['headerRight'] !== null) {
                $this->assertLessThanOrEqual(
                    $metrics['clientWidth'] + 1,
                    (int) $metrics['headerRight'],
                    'header right edge must stay inside the viewport at '.$width.'px',
                );
            }
            if ($metrics['bgRight'] !== null) {
                $this->assertLessThanOrEqual(
                    $metrics['clientWidth'] + 1,
                    (int) $metrics['bgRight'],
                    'hero background image must stay inside the viewport at '.$width.'px',
                );
            }

            if ($burgerVisible) {
                $this->assertNotSame('none', $metrics['toggleDisplay'], 'burger must be visible at '.$width.'px');
            } else {
                $this->assertSame('none', $metrics['toggleDisplay'], 'burger must be hidden at '.$width.'px');
            }
        } finally {
            @unlink($htmlPath);
        }
    }
}
