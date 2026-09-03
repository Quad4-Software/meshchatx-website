<?php

namespace App\Providers;

use App\Services\ChangelogService;
use App\Services\DocsService;
use App\Services\GithubReleasesService;
use App\Services\RnsDirectoryService;
use App\Services\SbomService;
use App\Support\SiteUri;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GithubReleasesService::class);
        $this->app->singleton(RnsDirectoryService::class);
        $this->app->singleton(DocsService::class);
        $this->app->singleton(ChangelogService::class);
        $this->app->singleton(SbomService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::share('site', [
            'name' => config('meshchatx.name'),
            'domain' => SiteUri::normalize((string) config('meshchatx.domain')) ?? config('meshchatx.domain'),
            'locales' => config('meshchatx.locales'),
            'default_locale' => config('meshchatx.default_locale'),
            'prefixed_locales' => config('meshchatx.prefixed_locales'),
            'og_locales' => config('meshchatx.og_locales'),
            'github_url' => config('meshchatx.github_url'),
            'github_releases' => config('meshchatx.github_releases'),
            'github_releases_atom' => config('meshchatx.github_releases_atom'),
            'github_changelog' => config('meshchatx.github_changelog'),
            'github_changelog_raw' => config('meshchatx.github_changelog_raw'),
            'github_clone' => config('meshchatx.github_clone'),
            'github_pkgbuild' => config('meshchatx.github_pkgbuild'),
            'rngit_rns' => config('meshchatx.rngit_rns'),
            'rngit_nomadnet' => config('meshchatx.rngit_nomadnet'),
            'lavaforge_url' => config('meshchatx.lavaforge_url'),
            'lavaforge_clone' => config('meshchatx.lavaforge_clone'),
            'pypi_url' => config('meshchatx.pypi_url'),
            'pypi_package' => config('meshchatx.pypi_package'),
            'docker_hub' => config('meshchatx.docker_hub'),
            'ghcr' => config('meshchatx.ghcr'),
            'umbrel_url' => config('meshchatx.umbrel_url'),
            'rns_directory_url' => config('meshchatx.rns_directory_url'),
            'obtainium_url' => config('meshchatx.obtainium_url'),
            'reticulum_crypto' => config('meshchatx.reticulum_crypto'),
            'docs' => config('meshchatx.docs'),
            'quad4_url' => config('meshchatx.quad4_url'),
            'website_license_url' => config('meshchatx.website_license_url'),
            'sitemap' => config('meshchatx.sitemap'),
            'nav' => config('meshchatx.nav'),
            'mobile_nav_secondary' => config('meshchatx.mobile_nav_secondary'),
            'footer_nav' => config('meshchatx.footer_nav'),
            'contact' => config('meshchatx.contact'),
            'donate' => config('meshchatx.donate'),
            'platforms' => config('meshchatx.platforms'),
            'youtube' => config('meshchatx.youtube'),
        ]);
    }
}
