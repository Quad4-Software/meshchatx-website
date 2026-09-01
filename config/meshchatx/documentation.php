<?php

return [
    'default_slug' => 'overview',
    'content_path' => base_path('content/docs'),
    'groups' => [
        [
            'label_key' => 'docs.group.start',
            'items' => [
                ['slug' => 'overview', 'icon' => 'file-document'],
                ['slug' => 'getting-started', 'icon' => 'rocket'],
                ['slug' => 'installation', 'icon' => 'download'],
                ['slug' => 'building', 'icon' => 'package-variant'],
                ['slug' => 'development', 'icon' => 'wrench'],
                ['slug' => 'architecture', 'icon' => 'orbit'],
            ],
        ],
        [
            'label_key' => 'docs.group.use',
            'items' => [
                ['slug' => 'messaging', 'icon' => 'message'],
                ['slug' => 'audio-calls', 'icon' => 'phone'],
                ['slug' => 'nomad-network', 'icon' => 'web'],
                ['slug' => 'interfaces', 'icon' => 'orbit'],
                ['slug' => 'tools', 'icon' => 'wrench'],
                ['slug' => 'identity-and-security', 'icon' => 'shield-lock'],
                ['slug' => 'plugins', 'icon' => 'package-variant'],
                ['slug' => 'rns-link-api', 'icon' => 'orbit'],
            ],
        ],
        [
            'label_key' => 'docs.group.authoring',
            'items' => [
                ['slug' => 'nomadmesh-pages', 'icon' => 'file-document'],
            ],
        ],
        [
            'label_key' => 'docs.group.platforms',
            'items' => [
                ['slug' => 'raspberry-pi', 'icon' => 'linux'],
                ['slug' => 'android-termux', 'icon' => 'android'],
                ['slug' => 'quest-sidequest', 'icon' => 'monitor'],
                ['slug' => 'linux-sandbox', 'icon' => 'shield-lock'],
            ],
        ],
    ],
];
