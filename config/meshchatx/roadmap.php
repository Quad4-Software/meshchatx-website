<?php

return [
    [
        'version' => '4.7.0',
        'date' => 'June 2026',
        'title' => 'RRC Protocol, Multi-Pane UI, and RNSH Manager',
        'desc' => 'RRC is an IRC-style ephemeral chat protocol over Reticulum with hub-and-spoke rooms and CBOR wire encoding.',
        'features' => [
            ['text' => 'RRC protocol support (channels, hub-and-spoke, ephemeral messaging)'],
            ['text' => 'Multi-pane chat layouts'],
            ['text' => 'Nomadnet browser tabs'],
            ['text' => 'RNSH session manager for multiple concurrent SSH-over-Reticulum sessions'],
        ],
        'status' => 'planned',
    ],
    [
        'version' => '4.8.0',
        'date' => 'July 2026',
        'title' => 'Visualiser, Plugins, and Platform Work',
        'desc' => 'RNS-over-HTTP, visualiser and startup work, plugins and RNX tooling, plus LXST audio, notifications, and container sandbox changes.',
        'features' => [
            ['text' => 'RNS-over-HTTP interface'],
            ['text' => 'Visualiser updates (WASM + WebGL)'],
            ['text' => 'Faster startup'],
            ['text' => 'Battery use reductions'],
            ['text' => 'Plugins'],
            ['text' => 'RNX tool'],
            ['text' => 'UI and styling fixes'],
            ['text' => 'LXST half-duplex and PTT support'],
            ['text' => 'In-app notification changes'],
            ['text' => 'Seccomp-bpf and Landlock tuning'],
            ['text' => 'Docker image layer changes'],
        ],
        'status' => 'planned',
    ],
    [
        'version' => '4.9.0',
        'date' => 'August 2026',
        'title' => 'Map, UI, and Codebase Cleanup',
        'desc' => 'Map updates, UI cleanup, RRC LXMFy bots, and codebase cleanup ahead of 5.0.0.',
        'features' => [
            ['text' => 'Map updates'],
            ['text' => 'UI cleanup'],
            ['text' => 'RRC LXMFy bots'],
            ['text' => 'Codebase cleanup'],
        ],
        'status' => 'planned',
    ],
    [
        'version' => '5.0.0',
        'date' => 'September 2026',
        'title' => 'Last Feature Release',
        'desc' => 'Last planned feature release. After 5.0.0, MeshChatX moves to maintenance: security fixes, bug fixes, performance fixes, Electron updates, and dependency bumps.',
        'features' => [],
        'status' => 'planned',
    ],
];
