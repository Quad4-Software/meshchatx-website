<?php

use App\Http\Controllers\BrandingController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DonateController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\GitController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\ReleasesApiController;
use App\Http\Controllers\RoadmapController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

$registerPages = function (): void {
    Route::get('/', HomeController::class)->name('home');
    Route::get('/download', DownloadController::class)->name('download');
    Route::get('/roadmap', RoadmapController::class)->name('roadmap');
    Route::get('/branding', BrandingController::class)->name('branding');
    Route::get('/contact', ContactController::class)->name('contact');
    Route::get('/donate', DonateController::class)->name('donate');
    Route::get('/license', LicenseController::class)->name('license');
    Route::get('/privacy', PrivacyController::class)->name('privacy');
    Route::get('/git', GitController::class)->name('git');
};

Route::middleware('locale')->group($registerPages);

Route::prefix('{locale}')
    ->whereIn('locale', config('meshchatx.prefixed_locales', ['de', 'ru', 'it', 'zh']))
    ->middleware('locale')
    ->name('locale.')
    ->group($registerPages);

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', RobotsController::class)->name('robots');
Route::get('/api/mcx-releases', ReleasesApiController::class)->name('api.mcx-releases');
