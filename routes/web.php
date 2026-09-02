<?php

use App\Http\Controllers\BrandingController;
use App\Http\Controllers\ChangelogController;
use App\Http\Controllers\ChangelogEntriesController;
use App\Http\Controllers\ChangelogRssController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DocsController;
use App\Http\Controllers\DonateController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\GitController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InterfacesApiController;
use App\Http\Controllers\InterfacesController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\OfflineController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\ReleasesApiController;
use App\Http\Controllers\RoadmapController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\ServiceWorkerController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

$registerPages = function (): void {
    Route::get('/', HomeController::class)->name('home');
    Route::get('/download', DownloadController::class)->name('download');
    Route::get('/roadmap', RoadmapController::class)->name('roadmap');
    Route::get('/changelog', ChangelogController::class)->name('changelog');
    Route::get('/changelog/entries', ChangelogEntriesController::class)->name('changelog.entries');
    Route::get('/branding', BrandingController::class)->name('branding');
    Route::get('/contact', ContactController::class)->name('contact');
    Route::get('/donate', DonateController::class)->name('donate');
    Route::get('/license', LicenseController::class)->name('license');
    Route::get('/privacy', PrivacyController::class)->name('privacy');
    Route::get('/git', GitController::class)->name('git');
    Route::get('/interfaces', InterfacesController::class)->name('interfaces');
    Route::get('/offline', OfflineController::class)->name('offline');
    Route::get('/docs', [DocsController::class, 'index'])->name('docs');
    Route::get('/docs/export-all/{format}', [DocsController::class, 'exportAll'])
        ->where('format', 'md|txt|pdf|epub')
        ->name('docs.export-all');
    Route::get('/docs/{slug}/export/{format}', [DocsController::class, 'export'])
        ->where('format', 'md|txt')
        ->name('docs.export');
    Route::get('/docs/{slug}', [DocsController::class, 'show'])
        ->name('docs.show');
};

Route::middleware('locale')->group($registerPages);

Route::prefix('{locale}')
    ->whereIn('locale', config('meshchatx.prefixed_locales', ['de', 'ru', 'it', 'zh']))
    ->middleware('locale')
    ->name('locale.')
    ->group($registerPages);

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/changelog.xml', ChangelogRssController::class)->name('changelog.rss');
Route::get('/sw.js', ServiceWorkerController::class)->name('pwa.sw');
Route::get('/robots.txt', RobotsController::class)->name('robots');
Route::get('/api/mcx-releases', ReleasesApiController::class)->name('api.mcx-releases');
Route::get('/api/mcx-interfaces', InterfacesApiController::class)->name('api.mcx-interfaces');
