<?php

return [
    'name' => 'MeshChatX',
    'domain' => env('MESHCHATX_DOMAIN', 'https://meshchatx.com'),
    'github_repo' => 'Quad4-Software/MeshChatX',
    'github_url' => 'https://github.com/Quad4-Software/MeshChatX',
    'github_releases' => 'https://github.com/Quad4-Software/MeshChatX/releases',
    'github_releases_atom' => 'https://github.com/Quad4-Software/MeshChatX/releases.atom',
    'github_changelog' => 'https://github.com/Quad4-Software/MeshChatX/blob/master/CHANGELOG.md',
    'github_clone' => 'https://github.com/Quad4-Software/MeshChatX.git',
    'github_pkgbuild' => 'https://github.com/Quad4-Software/MeshChatX/blob/master/packaging/arch/PKGBUILD',
    'rngit_rns' => 'rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX',
    'rngit_nomadnet' => '132f67e79d9b24aad014e93015fb858f:/page/repo.mu`g=public|r=MeshChatX',
    'lavaforge_url' => 'https://lavaforge.org/Reticulum-Things/MeshChatX',
    'lavaforge_clone' => 'https://lavaforge.org/Reticulum-Things/MeshChatX.git',
    'pypi_url' => 'https://pypi.org/project/reticulum-meshchatx/',
    'pypi_package' => 'reticulum-meshchatx',
    'docker_hub' => 'quad4io/meshchatx:latest',
    'ghcr' => 'ghcr.io/quad4-software/meshchatx:latest',
    'umbrel_url' => 'https://apps.umbrel.com/app/meshchatx',
    'rns_directory_url' => 'https://directory.rns.recipes/',
    'rns_directory_api' => 'https://directory.rns.recipes/api/directory/submitted?search=&type=&status=online',
    'obtainium_url' => 'https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/Quad4-Software/MeshChatX',
    'reticulum_crypto' => 'https://reticulum.network/crypto.html',
    'quad4_url' => 'https://quad4.io/',
    'website_license_url' => 'https://github.com/MeshChatX/website/blob/master/LICENSE',

    'locales' => ['en', 'de', 'ru', 'it', 'zh'],
    'default_locale' => 'en',
    'prefixed_locales' => ['de', 'ru', 'it', 'zh'],

    'og_locales' => [
        'en' => 'en_US',
        'de' => 'de_DE',
        'ru' => 'ru_RU',
        'it' => 'it_IT',
        'zh' => 'zh_CN',
    ],

    'contact' => [
        'lxmf' => 'f489752fbef161c64d65e385a4e9fc74',
        'email' => 'team@quad4.io',
    ],

    'donate' => [
        'xmr' => '8AfDSLVeTSt1oku5ifK4jkbJ94fp5kW6y5RWxuP1FYmyZmLHYRVSrPXJJaX7mK1n7MQUzwYE15uVdQVeAuWWnR5pDkN52xU',
        'kofi' => 'https://ko-fi.com/quad4',
        'bmac' => 'https://buymeacoffee.com/quad4',
    ],

    'youtube' => [
        ['id' => 'defFiXuuxKg', 'title_key' => 'home.videos.youtube_title'],
        ['id' => 'no7bahDoIUs', 'title_key' => 'home.videos.youtube_title_2'],
    ],

    'nav' => [
        ['label_key' => 'nav.features', 'href' => '#features', 'home_only' => true],
        ['label_key' => 'nav.download', 'route' => 'download'],
        ['label_key' => 'nav.roadmap', 'route' => 'roadmap'],
        ['label_key' => 'nav.donate', 'route' => 'donate'],
        ['label_key' => 'nav.contact', 'route' => 'contact'],
        ['label_key' => 'nav.git', 'route' => 'git'],
    ],

    'footer_nav' => [
        ['label_key' => 'nav.git', 'route' => 'git'],
        ['label_key' => 'nav.interfaces', 'route' => 'interfaces'],
        ['label_key' => 'footer.changelog', 'external' => 'github_changelog'],
        ['label_key' => 'nav.branding', 'route' => 'branding'],
        ['label_key' => 'footer.license', 'route' => 'license'],
        ['label_key' => 'footer.privacy', 'route' => 'privacy'],
    ],

    'pages' => ['home', 'download', 'roadmap', 'interfaces', 'branding', 'contact', 'donate', 'license', 'privacy', 'git'],

    'sitemap' => [
        'home',
        'download',
        'roadmap',
        'interfaces',
        'branding',
        'contact',
        'donate',
        'license',
        'privacy',
        'git',
    ],

    'capabilities' => [
        'messaging',
        'calls',
        'browser',
        'file_transfer',
        'bots',
        'micron',
        'archiver',
        'mapping',
        'discovery',
        'identities',
        'banishment',
        'backups',
        'customizable',
        'telemetry',
        'host_pages',
    ],

    'showcase_tabs' => [
        'tab-11-home.webp',
        'tab-0-messages.webp',
        'tab-1-contacts.webp',
        'tab-2-calls.webp',
        'tab-3-interfaces.webp',
        'tab-4-map.webp',
        'tab-5-nomadnet.webp',
        'tab-6-visualizer.webp',
        'tab-7-utilities.webp',
        'tab-8-settings.webp',
        'tab-9-identity.webp',
        'tab-10-about.webp',
    ],

    'platforms' => [
        ['key' => 'macos', 'hash' => 'macos', 'icon' => 'apple'],
        ['key' => 'linux', 'hash' => 'linux', 'icon' => 'linux'],
        ['key' => 'windows', 'hash' => 'windows', 'icon' => 'windows'],
        ['key' => 'docker', 'hash' => 'docker', 'icon' => 'docker'],
        ['key' => 'python', 'hash' => 'python', 'icon' => 'python'],
        ['key' => 'android', 'hash' => 'android', 'icon' => 'android'],
    ],

    'releases_cache_seconds' => (int) env('RELEASES_CACHE_SECONDS', 3600),
    'rns_directory_cache_seconds' => (int) env('RNS_DIRECTORY_CACHE_SECONDS', 259200),
];
