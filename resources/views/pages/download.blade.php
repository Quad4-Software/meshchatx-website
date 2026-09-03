@php
    $page = 'download';
    $channel = $channel ?? 'stable';
    $releases = $releases ?? [
        'stable' => null,
        'beta' => null,
        'testing' => null,
        'prerelease' => null,
        'githubFallbackUrl' => $site['github_releases'],
        'versions' => ['stable' => [], 'beta' => [], 'testing' => [], 'prerelease' => []],
    ];
    $versions = $versions ?? ($releases['versions'][$channel] ?? []);
    $active = $active ?? (is_array($releases[$channel] ?? null) ? $releases[$channel] : null);
    $selectedTag = $selectedTag ?? (is_array($active) ? (string) ($active['tag'] ?? $active['version'] ?? '') : '');
    $selectedSource = $selectedSource ?? (is_array($active) ? (string) ($active['downloadServer'] ?? 'github') : 'github');
    $downloadServers = $downloadServers ?? (is_array($active) && is_array($active['downloadServers'] ?? null)
        ? $active['downloadServers']
        : []);
    $channelLatest = is_array($releases[$channel] ?? null) ? $releases[$channel] : null;
    $isChannelLatest = is_array($active) && is_array($channelLatest)
        && (
            ($active['tag'] ?? null) === ($channelLatest['tag'] ?? null)
            || ($active['version'] ?? null) === ($channelLatest['version'] ?? null)
        );

    $pickAsset = function (?array $row, ?array $fallback, string $urlField): array {
        $shaField = (string) preg_replace('/Url$/', 'Sha256', $urlField);
        foreach ([$row, $fallback] as $candidate) {
            if (! is_array($candidate)) {
                continue;
            }
            $url = $candidate[$urlField] ?? null;
            if (! is_string($url) || $url === '') {
                continue;
            }
            $sha = $candidate[$shaField] ?? null;

            return [
                'url' => $url,
                'sha256' => is_string($sha) && $sha !== '' ? $sha : null,
            ];
        }

        return ['url' => null, 'sha256' => null];
    };

    $assetFallback = null;

    $macDmgAsset = $pickAsset($active, $assetFallback, 'macDmgUrl');
    $appAmdAsset = $pickAsset($active, $assetFallback, 'appImageAmd64Url');
    $appArmAsset = $pickAsset($active, $assetFallback, 'appImageArm64Url');
    $debAAsset = $pickAsset($active, $assetFallback, 'debAmd64Url');
    $debRAsset = $pickAsset($active, $assetFallback, 'debArm64Url');
    $rpmAAsset = $pickAsset($active, $assetFallback, 'rpmAmd64Url');
    $flatAsset = $pickAsset($active, $assetFallback, 'flatpakUrl');
    $alpineApkAsset = $pickAsset($active, $assetFallback, 'alpineApkUrl');
    $winInstallerAsset = $pickAsset($active, $assetFallback, 'winInstallerUrl');
    $winPortableAsset = $pickAsset($active, $assetFallback, 'winPortableUrl');
    $apkAsset = $pickAsset($active, $assetFallback, 'apkUrl');
    $wheelAsset = $pickAsset($active, $assetFallback, 'wheelUrl');
    $sbomAsset = $pickAsset($active, $assetFallback, 'sbomUrl');

    $macDmg = $macDmgAsset['url'];
    $macDmgSha = $macDmgAsset['sha256'];
    $appAmd = $appAmdAsset['url'];
    $appAmdSha = $appAmdAsset['sha256'];
    $appArm = $appArmAsset['url'];
    $appArmSha = $appArmAsset['sha256'];
    $debA = $debAAsset['url'];
    $debASha = $debAAsset['sha256'];
    $debR = $debRAsset['url'];
    $debRSha = $debRAsset['sha256'];
    $rpmA = $rpmAAsset['url'];
    $rpmASha = $rpmAAsset['sha256'];
    $flat = $flatAsset['url'];
    $flatSha = $flatAsset['sha256'];
    $alpineApk = $alpineApkAsset['url'];
    $alpineApkSha = $alpineApkAsset['sha256'];
    $winInstaller = $winInstallerAsset['url'];
    $winInstallerSha = $winInstallerAsset['sha256'];
    $winPortable = $winPortableAsset['url'];
    $winPortableSha = $winPortableAsset['sha256'];
    $apkUrl = $apkAsset['url'];
    $apkSha = $apkAsset['sha256'];
    $wheelUrl = $wheelAsset['url'];
    $wheelSha = $wheelAsset['sha256'];
    $sbomUrl = $sbomAsset['url'];

    $downloadServer = in_array($selectedSource, ['bunny', 'github'], true)
        ? $selectedSource
        : ((is_array($downloadServers) && in_array('bunny', $downloadServers, true)) ? 'bunny' : 'github');
    $canChooseServer = is_array($downloadServers) && count($downloadServers) > 1;

    $channelQs = function (string $name) use ($canChooseServer, $downloadServer): string {
        $qs = locale_route('download').'?channel='.rawurlencode($name);
        if ($canChooseServer) {
            $qs .= '&source='.rawurlencode($downloadServer);
        }

        return $qs;
    };

    $channelLabel = match ($channel) {
        'beta' => t('js.download.beta'),
        'testing' => t('js.download.testing'),
        default => t('js.download.stable'),
    };

    $flatpakCdnBase = rtrim((string) ($site['flatpak_cdn_base'] ?? 'https://cdn.meshchatx.com/flatpak'), '/');
    $flatpakAppId = (string) ($site['flatpak_app_id'] ?? 'com.quad4.meshchatx');
    $flatpakRefName = match ($channel) {
        'beta' => 'meshchatx-beta.flatpakref',
        'testing' => 'meshchatx-testing.flatpakref',
        default => 'meshchatx-stable.flatpakref',
    };
    $flatpakRefUrl = $flatpakCdnBase.'/'.$flatpakRefName;
    $flatpakRepoUrl = $flatpakCdnBase.'/meshchatx.flatpakrepo';
    $flatpakInstallFrom = "flatpak install --from {$flatpakRefUrl}\nflatpak run {$flatpakAppId}\nflatpak update";
    $flatpakRemoteAdd = "flatpak remote-add --if-not-exists meshchatx \\\n  {$flatpakRepoUrl}\nflatpak install meshchatx {$flatpakAppId}//{$channel}";
    $flatpakBundleInstall = "flatpak install --user ./ReticulumMeshChatX-*.flatpak\nflatpak run {$flatpakAppId}";

    $pkg = $site['pypi_package'];
    $hub = $site['docker_hub'];
    $ghcr = $site['ghcr'];
    $clone = $site['github_clone'];

    $composeYaml = <<<'YAML'
services:
  meshchatx:
    image: quad4io/meshchatx:latest
    # or ghcr.io/quad4-software/meshchatx:latest
    ports:
      - "8000:8000"
    volumes:
      - meshchatx-data:/root/.reticulum
volumes:
  meshchatx-data:
YAML;

    $dockerRun = "docker run -d --name reticulum-meshchatx \\\n"
        ."  --restart unless-stopped \\\n"
        ."  --security-opt no-new-privileges:true \\\n"
        ."  -p 127.0.0.1:8000:8000 \\\n"
        ."  -v meshchatx-config:/config \\\n"
        ."  {$hub}";
    $podmanRun = "podman run -d --name reticulum-meshchatx \\\n"
        ."  --restart unless-stopped \\\n"
        ."  --security-opt no-new-privileges:true \\\n"
        ."  -p 127.0.0.1:8000:8000 \\\n"
        ."  -v meshchatx-config:/config \\\n"
        ."  {$hub}";

    $pypi = [
        'pip' => "pip install {$pkg}",
        'pipx' => "pipx install {$pkg}",
        'poetry' => "poetry add {$pkg}",
        'uv' => "uv pip install {$pkg}",
        'uvx' => "uvx --from {$pkg} meshchatx",
    ];

    $tabs = [
        ['id' => 'windows', 'icon' => 'windows', 'label' => t('dl.tabs.windows'), 'hint' => t('dl.pick.windows_hint')],
        ['id' => 'macos', 'icon' => 'apple', 'label' => t('dl.tabs.macos'), 'hint' => t('dl.pick.macos_hint')],
        ['id' => 'linux', 'icon' => 'linux', 'label' => t('dl.tabs.linux'), 'hint' => t('dl.pick.linux_hint')],
        ['id' => 'flatpak', 'icon' => 'flatpak', 'label' => t('dl.tabs.flatpak'), 'hint' => t('dl.pick.flatpak_hint')],
        ['id' => 'android', 'icon' => 'android', 'label' => t('dl.tabs.android'), 'hint' => t('dl.pick.android_hint')],
        ['id' => 'docker', 'icon' => 'docker', 'label' => t('dl.tabs.docker'), 'hint' => t('dl.pick.docker_hint')],
        ['id' => 'python', 'icon' => 'python', 'label' => t('dl.tabs.python'), 'hint' => t('dl.pick.python_hint')],
    ];
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero page-hero--compact">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('dl.h1') }}</h1>
            <p class="page-hero__lead">{{ t('dl.lead') }}</p>

            <noscript>
                <div class="prose-block" role="status" style="margin-top:1.25rem;padding:1rem;border:1px solid var(--color-line);background:var(--color-surface)">
                    <p><strong>{{ t('dl.nojs_banner_title') }}</strong></p>
                    <p>{{ t('dl.nojs_banner_text') }}</p>
                </div>
            </noscript>

            <div class="download-hero-meta">
                <div class="download-hero-controls">
                    <div class="channel-toggle">
                        <a class="channel-toggle__btn{{ $channel === 'stable' ? ' is-active' : '' }}" href="{{ $channelQs('stable') }}">{{ t('js.download.channel_stable') }}</a>
                        <a class="channel-toggle__btn{{ $channel === 'beta' ? ' is-active' : '' }}" href="{{ $channelQs('beta') }}">{{ t('js.download.channel_beta') }}</a>
                        <a class="channel-toggle__btn{{ $channel === 'testing' ? ' is-active' : '' }}" href="{{ $channelQs('testing') }}">{{ t('js.download.channel_testing') }}</a>
                    </div>

                    @if ($versions !== [])
                        <label class="download-version">
                            <span class="download-version__label">{{ t('js.download.select_version') }}</span>
                            <select
                                class="dep-select download-version__select"
                                data-download-version
                                data-download-version-base="{{ locale_route('download') }}"
                                data-download-version-channel="{{ $channel }}"
                                data-download-version-source="{{ $canChooseServer ? $downloadServer : '' }}"
                                aria-label="{{ t('js.download.select_version') }}"
                            >
                                @foreach ($versions as $row)
                                    <option
                                        value="{{ $row['tag'] }}"
                                        @selected($selectedTag !== '' && ($selectedTag === $row['tag'] || $selectedTag === $row['version']))
                                    >{{ $row['version'] }}</option>
                                @endforeach
                            </select>
                        </label>
                    @endif
                </div>

                @if (is_array($active) && ! empty($active['version']))
                    <p class="version-badge version-badge--fade">
                        @if ($isChannelLatest)
                            {{ t('js.download.latest') }}
                        @endif
                        v{{ $active['version'] }}
                        ({{ $channelLabel }})
                    </p>
                    @if ($canChooseServer)
                        <label class="download-version download-server-pick">
                            <span class="download-version__label">{{ t('dl.download_server') }}</span>
                            <select
                                class="dep-select download-version__select"
                                data-download-source
                                data-download-source-base="{{ locale_route('download') }}"
                                data-download-source-channel="{{ $channel }}"
                                data-download-source-version="{{ $selectedTag }}"
                                aria-label="{{ t('dl.download_server') }}"
                            >
                                @foreach ($downloadServers as $server)
                                    <option value="{{ $server }}" @selected($downloadServer === $server)>
                                        {{ $server === 'bunny' ? t('dl.download_server_bunny') : t('dl.download_server_github') }}
                                    </option>
                                @endforeach
                            </select>
                        </label>
                    @elseif ($downloadServers !== [])
                        <p class="download-server" data-download-server="{{ $downloadServer }}">
                            <span class="download-server__label">{{ t('dl.download_server') }}</span>
                            <span class="download-server__value">{{ $downloadServer === 'bunny' ? t('dl.download_server_bunny') : t('dl.download_server_github') }}</span>
                        </p>
                    @endif
                @else
                    <p class="section__lead">{{ t('js.download.no_release') }}</p>
                @endif

                @php
                    $heroPlatforms = [
                        'windows' => [
                            'label' => t('dl.tabs.windows'),
                            'url' => $winInstaller ?: $winPortable,
                            'sha256' => $winInstaller ? $winInstallerSha : $winPortableSha,
                        ],
                        'macos' => [
                            'label' => t('dl.tabs.macos'),
                            'url' => $macDmg,
                            'sha256' => $macDmgSha,
                        ],
                        'linux' => [
                            'label' => t('dl.tabs.linux'),
                            'url' => $appAmd ?: $appArm,
                            'sha256' => $appAmd ? $appAmdSha : $appArmSha,
                        ],
                        'flatpak' => [
                            'label' => t('dl.tabs.flatpak'),
                            'url' => $flat,
                            'sha256' => $flatSha,
                        ],
                        'android' => [
                            'label' => t('dl.tabs.android'),
                            'url' => $apkUrl,
                            'sha256' => $apkSha,
                        ],
                        'docker' => [
                            'label' => t('dl.tabs.docker'),
                            'url' => null,
                            'sha256' => null,
                        ],
                        'python' => [
                            'label' => t('dl.tabs.python'),
                            'url' => $wheelUrl,
                            'sha256' => $wheelSha,
                        ],
                    ];
                    $docsGettingStarted = locale_route('docs.show', ['slug' => 'getting-started']);
                    $ctaTemplate = t('dl.cta.download_for');
                @endphp

                <div
                    class="download-hero-cta"
                    data-download-hero
                    data-cta-template="{{ $ctaTemplate }}"
                    data-fallback-platform="linux"
                >
                    @foreach ($heroPlatforms as $platformId => $meta)
                        <script type="application/json" data-download-hero-platform="{{ $platformId }}">{!! json_encode([
                            'id' => $platformId,
                            'label' => $meta['label'],
                            'url' => $meta['url'],
                            'sha256' => $meta['sha256'],
                        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
                    @endforeach
                    <div class="download-hero-cta__stack">
                        <div class="download-checksum" data-download-hero-checksum hidden>
                            <span class="download-checksum__label">{{ t('dl.sha256') }}</span>
                            <button
                                type="button"
                                class="download-checksum__value"
                                data-download-hero-checksum-value
                                data-copy-text=""
                                aria-label="{{ t('dl.copy_sha256') }}"
                                title="{{ t('dl.copy_sha256') }}"
                            ></button>
                        </div>
                        <div class="download-hero-cta__actions">
                            <a
                                class="btn btn--solid"
                                data-download-hero-btn
                                href="#linux"
                                hidden
                            >
                                <x-icon name="download" size="xs" />
                                <span data-download-hero-label>{{ t('dl.cta.download_for', ['s' => t('dl.tabs.linux')]) }}</span>
                            </a>
                            <a class="btn btn--ghost" href="{{ $docsGettingStarted }}">{{ t('dl.cta.next_steps') }}</a>
                        </div>
                    </div>
                </div>

                <p class="download-hero-meta__links">
                    {{ t('dl.github_also') }}
                    <a href="{{ $site['github_releases'] }}" target="_blank" rel="noopener noreferrer">{{ t('dl.github_releases') }}</a>
                    ·
                    <a href="{{ $site['github_releases_atom'] }}" target="_blank" rel="noopener noreferrer">{{ t('dl.releases_atom') }}</a>
                    @if ($sbomUrl)
                        ·
                        <a href="{{ $sbomUrl }}" download>{{ t('dl.sbom') }}</a>
                    @endif
                    ·
                    <a href="{{ locale_route('interfaces') }}">{{ t('dl.cta.interfaces') }}</a>
                    ·
                    <a href="{{ locale_route('dependency') }}">{{ t('dl.cta.dependencies') }}</a>
                </p>
            </div>
        </div>
    </section>

    <section class="section section--tight" data-download>
        <div class="site-container download-layout">
            <div>
                <h2 class="section__title">{{ t('dl.pick_h2') }}</h2>
                <p class="section__lead">{{ t('dl.pick_lead') }}</p>
            </div>

            <div class="download-pick" role="tablist" aria-label="{{ t('dl.pick_h2') }}">
                @foreach ($tabs as $index => $tab)
                    <a
                        class="download-pick__btn{{ $index === 0 ? ' is-active' : '' }}"
                        href="#{{ $tab['id'] }}"
                        data-download-tab="{{ $tab['id'] }}"
                        role="tab"
                        aria-selected="{{ $index === 0 ? 'true' : 'false' }}"
                    >
                        <span class="download-pick__icon"><x-icon :name="$tab['icon']" size="sm" /></span>
                        <span class="download-pick__label">{{ $tab['label'] }}</span>
                        <span class="download-pick__hint">{{ $tab['hint'] }}</span>
                    </a>
                @endforeach
            </div>

            <div class="download-panel is-active" id="windows" data-download-panel="windows">
                <h2 class="section__title">{{ t('dl.windows.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.windows.friendly') }}</p>
                <p class="version-badge">{{ t('dl.windows.badge_64') }}</p>
                <div class="download-panel__actions">
                    @if ($winInstaller)
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$winInstallerSha" />
                            <a class="btn btn--solid" href="{{ $winInstaller }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.windows.btn_installer') }}
                            </a>
                        </div>
                    @endif
                    @if ($winPortable)
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$winPortableSha" />
                            <a class="btn btn--ghost" href="{{ $winPortable }}" download>{{ t('dl.windows.btn_portable') }}</a>
                        </div>
                    @endif
                </div>
                @if (! $winInstaller && ! $winPortable)
                    <p class="download-panel__intro">{{ t('dl.windows.no_win') }}</p>
                @endif
            </div>

            <div class="download-panel" id="macos" data-download-panel="macos" hidden>
                <h2 class="section__title">{{ t('dl.macos.h2') }}</h2>
                @if (! $macDmg)
                    <p class="download-panel__intro">{{ t('dl.macos.note') }}</p>
                    <p class="version-badge">{{ t('dl.macos.badge') }}</p>
                    <p class="download-panel__intro">
                        {{ t('dl.macos.hint_before') }}<a href="#python" data-download-tab="python">{{ t('dl.macos.hint_python') }}</a>{{ t('dl.macos.hint_mid') }}<a href="#docker" data-download-tab="docker">{{ t('dl.macos.hint_docker') }}</a>{{ t('dl.macos.hint_after') }}
                    </p>
                @else
                    <p class="download-panel__intro">{{ t('dl.macos.friendly') }}</p>
                    <div class="download-panel__actions">
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$macDmgSha" />
                            <a class="btn btn--solid" href="{{ $macDmg }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.macos.btn_dmg') }}
                            </a>
                        </div>
                    </div>
                @endif
            </div>

            <div class="download-panel" id="linux" data-download-panel="linux" hidden>
                <h2 class="section__title">{{ t('dl.linux.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.linux.friendly') }}</p>

                <h3 class="download-panel__subhead">{{ t('dl.linux.appimage') }}</h3>
                <p class="download-panel__intro">{{ t('dl.linux.appimage_intro') }}</p>
                <div class="download-panel__actions">
                    @if ($appAmd)
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$appAmdSha" />
                            <a class="btn btn--solid" href="{{ $appAmd }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.linux.btn_appimage_amd64') }}
                            </a>
                        </div>
                    @endif
                    @if ($appArm)
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$appArmSha" />
                            <a class="btn btn--ghost" href="{{ $appArm }}" download>{{ t('dl.linux.btn_appimage_arm64') }}</a>
                        </div>
                    @endif
                </div>
                @if (! $appAmd && ! $appArm)
                    <p class="download-panel__intro">{{ t('dl.linux.no_appimage') }}</p>
                @endif
                <div class="command-block">
                    <div class="command-block__header">
                        <span>{{ t('dl.linux.install_run') }}</span>
                        <button type="button" class="copy-btn" data-copy="#cmd-appimage" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                    </div>
                    <pre class="command-block__body" id="cmd-appimage"><code>chmod +x MeshChatX-*.AppImage
./MeshChatX-*.AppImage</code></pre>
                </div>

                <details class="download-advanced">
                    <x-download-more-options :icons="[
                        ['file' => 'debian', 'label' => 'Debian'],
                        ['file' => 'fedora', 'label' => 'Fedora / RPM'],
                        ['file' => 'alpinelinux', 'label' => 'Alpine'],
                        ['file' => 'archlinux', 'label' => 'Arch Linux'],
                    ]" />
                    <div class="download-stack">
                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.linux.deb') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.linux.deb_intro') }}</p>
                            <div class="download-panel__actions">
                                @if ($debA)
                                    <div class="download-artifact">
                                        <x-download-checksum :sha256="$debASha" />
                                        <a class="btn btn--solid" href="{{ $debA }}" download>{{ t('dl.linux.btn_deb_amd64') }}</a>
                                    </div>
                                @endif
                                @if ($debR)
                                    <div class="download-artifact">
                                        <x-download-checksum :sha256="$debRSha" />
                                        <a class="btn btn--ghost" href="{{ $debR }}" download>{{ t('dl.linux.btn_deb_arm64') }}</a>
                                    </div>
                                @endif
                            </div>
                            @if (! $debA && ! $debR)
                                <p class="download-panel__intro">{{ t('dl.linux.no_deb') }}</p>
                            @endif
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.install') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-deb" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-deb"><code>sudo apt install ./MeshChatX-*.deb
# fallback if apt cannot resolve dependencies:
sudo dpkg -i MeshChatX-*.deb
sudo apt -f install</code></pre>
                            </div>
                        </div>

                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.linux.rpm') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.linux.rpm_intro') }}</p>
                            <div class="download-panel__actions">
                                @if ($rpmA)
                                    <div class="download-artifact">
                                        <x-download-checksum :sha256="$rpmASha" />
                                        <a class="btn btn--solid" href="{{ $rpmA }}" download>{{ t('dl.linux.btn_rpm_amd64') }}</a>
                                    </div>
                                @endif
                            </div>
                            @if (! $rpmA)
                                <p class="download-panel__intro">{{ t('dl.linux.no_rpm') }}</p>
                            @endif
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.install') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-rpm" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-rpm"><code>sudo dnf install ./MeshChatX-*.rpm
# or on openSUSE:
sudo zypper install ./MeshChatX-*.rpm</code></pre>
                            </div>
                        </div>

                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.linux.alpine') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.linux.alpine_intro') }}</p>
                            <div class="download-panel__actions">
                                @if ($alpineApk)
                                    <div class="download-artifact">
                                        <x-download-checksum :sha256="$alpineApkSha" />
                                        <a class="btn btn--solid" href="{{ $alpineApk }}" download>{{ t('dl.linux.btn_alpine') }}</a>
                                    </div>
                                @endif
                            </div>
                            @if (! $alpineApk)
                                <p class="download-panel__intro">{{ t('dl.linux.no_alpine') }}</p>
                            @endif
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.install') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-alpine" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-alpine"><code>sudo apk add --allow-untrusted ./ReticulumMeshChatX-*-linux-alpine-*.apk</code></pre>
                            </div>
                        </div>

                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.linux.arch') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.linux.arch_intro_before') }}<code>pacman</code>{{ t('dl.linux.arch_intro_after') }}</p>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.arch_step1') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-arch-clone" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-arch-clone"><code>git clone {{ $clone }}
cd MeshChatX/packaging/arch</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.arch_step2') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-arch-build" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-arch-build"><code>makepkg -si</code></pre>
                            </div>
                            <p><a href="{{ $site['github_pkgbuild'] }}" target="_blank" rel="noopener noreferrer">{{ t('dl.linux.view_pkgbuild') }}</a></p>
                        </div>

                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.linux.source') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.linux.source_intro') }}</p>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.source_step1') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-src-clone" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-src-clone"><code>git clone {{ $clone }}
cd MeshChatX</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.source_step2') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-src-fe" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-src-fe"><code>corepack enable
pnpm install
pnpm run build-frontend</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.linux.source_step3') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-src-be" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-src-be"><code>pip install poetry
poetry install
poetry run meshchat --headless --host 127.0.0.1</code></pre>
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            <div class="download-panel" id="flatpak" data-download-panel="flatpak" hidden>
                <h2 class="section__title">{{ t('dl.flatpak.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.flatpak.friendly') }}</p>

                <h3 class="download-panel__subhead">{{ t('dl.flatpak.remote_h3') }}</h3>
                <p class="download-panel__intro">{{ t('dl.flatpak.remote_intro') }}</p>
                <div class="command-block">
                    <div class="command-block__header">
                        <span>{{ t('dl.flatpak.remote_install') }}</span>
                        <button type="button" class="copy-btn" data-copy="#cmd-flatpak-remote" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                    </div>
                    <pre class="command-block__body" id="cmd-flatpak-remote"><code>{{ $flatpakInstallFrom }}</code></pre>
                </div>
                <div class="command-block">
                    <div class="command-block__header">
                        <span>{{ t('dl.flatpak.remote_add') }}</span>
                        <button type="button" class="copy-btn" data-copy="#cmd-flatpak-repo" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                    </div>
                    <pre class="command-block__body" id="cmd-flatpak-repo"><code>{{ $flatpakRemoteAdd }}</code></pre>
                </div>
                <p class="download-panel__intro">{{ t('dl.flatpak.remote_note') }}</p>

                <h3 class="download-panel__subhead">{{ t('dl.flatpak.bundle_h3') }}</h3>
                <p class="download-panel__intro">{{ t('dl.flatpak.bundle_intro') }}</p>
                <div class="download-panel__actions">
                    @if ($flat)
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$flatSha" />
                            <a class="btn btn--solid" href="{{ $flat }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.flatpak.btn') }}
                            </a>
                        </div>
                    @else
                        <p class="download-panel__intro">{{ t('dl.flatpak.no_bundle') }}</p>
                    @endif
                </div>

                @if ($flat)
                    <div class="command-block">
                        <div class="command-block__header">
                            <span>{{ t('dl.flatpak.install') }}</span>
                            <button type="button" class="copy-btn" data-copy="#cmd-flatpak" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                        </div>
                        <pre class="command-block__body" id="cmd-flatpak"><code>{{ $flatpakBundleInstall }}</code></pre>
                    </div>
                @endif
            </div>

            <div class="download-panel" id="docker" data-download-panel="docker" hidden>
                <h2 class="section__title">{{ t('dl.containers.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.containers.friendly') }}</p>

                <h3 class="download-panel__subhead">{{ t('dl.containers.compose') }}</h3>
                <p class="download-panel__intro">{{ t('dl.containers.compose_intro_before') }}<code>{{ t('dl.containers.compose_filename') }}</code>{{ t('dl.containers.compose_intro_after') }}</p>
                <div class="command-block">
                    <div class="command-block__header">
                        <span>{{ t('dl.containers.compose_filename') }}</span>
                        <button type="button" class="copy-btn" data-copy="#cmd-compose" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_compose') }}</button>
                    </div>
                    <pre class="command-block__body" id="cmd-compose"><code>{{ $composeYaml }}</code></pre>
                </div>

                <details class="download-advanced">
                    <x-download-more-options :icons="[
                        ['file' => 'docker', 'label' => 'Docker'],
                        ['file' => 'podman', 'label' => 'Podman'],
                        ['file' => 'umbrel', 'label' => 'Umbrel'],
                    ]" />
                    <div class="download-stack" data-channel-group>
                        <div class="channel-toggle">
                            <button type="button" class="channel-toggle__btn is-active" data-channel="docker">{{ t('dl.containers.docker') }}</button>
                            <button type="button" class="channel-toggle__btn" data-channel="podman">{{ t('dl.containers.podman') }}</button>
                        </div>

                        <div data-channel-content="docker">
                            <p class="download-panel__intro">{{ t('dl.containers.run_docker') }} · {{ t('dl.containers.arch_badge') }}</p>
                            <p class="download-panel__intro">{{ t('dl.containers.registries_note') }}</p>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.registry_label_dockerhub') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-docker-hub" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_pull') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-docker-hub"><code>docker pull {{ $hub }}</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.registry_label_ghcr') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-docker-ghcr" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_pull') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-docker-ghcr"><code>docker pull {{ $ghcr }}</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.run_cmd') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-docker-run" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_run') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-docker-run"><code>{{ $dockerRun }}</code></pre>
                            </div>
                        </div>

                        <div data-channel-content="podman" hidden>
                            <p class="download-panel__intro">{{ t('dl.containers.run_podman') }} · {{ t('dl.containers.arch_badge') }}</p>
                            <p class="download-panel__intro">{{ t('dl.containers.registries_note') }}</p>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.registry_label_dockerhub') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-podman-hub" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_pull') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-podman-hub"><code>podman pull {{ $hub }}</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.registry_label_ghcr') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-podman-ghcr" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_pull') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-podman-ghcr"><code>podman pull {{ $ghcr }}</code></pre>
                            </div>
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.containers.run_cmd') }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-podman-run" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.containers.copy_run') }}</button>
                                </div>
                                <pre class="command-block__body" id="cmd-podman-run"><code>{{ $podmanRun }}</code></pre>
                            </div>
                        </div>
                    </div>

                    <div class="download-stack">
                        <div>
                            <h3 class="download-panel__subhead">{{ t('dl.umbrel.h2') }}</h3>
                            <p class="download-panel__intro">{{ t('dl.umbrel.intro') }}</p>
                            <div class="download-panel__actions">
                                <a class="btn btn--solid" href="{{ $site['umbrel_url'] }}" target="_blank" rel="noopener noreferrer">
                                    <x-icon name="open" size="xs" />
                                    {{ t('dl.umbrel.btn') }}
                                </a>
                            </div>
                        </div>
                    </div>
                </details>

                <p class="download-panel__intro">
                    {{ t('dl.containers.trivy_before') }}<a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer">{{ t('dl.containers.trivy_link') }}</a>.
                </p>
            </div>

            <div class="download-panel" id="python" data-download-panel="python" hidden>
                <h2 class="section__title">{{ t('dl.python.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.python.friendly') }}</p>
                <p class="download-panel__intro">
                    <a href="{{ $site['pypi_url'] }}" target="_blank" rel="noopener noreferrer" aria-label="{{ t('dl.python.pypi_link_aria') }}">{{ t('dl.python.pypi_link_text') }}</a>
                </p>

                @if (is_string($wheelUrl) && $wheelUrl !== '')
                    <div class="download-panel__actions">
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$wheelSha" />
                            <a class="btn btn--solid" href="{{ $wheelUrl }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.python.btn_whl') }}
                            </a>
                        </div>
                    </div>
                @endif

                <div class="command-block">
                    <div class="command-block__header">
                        <span>{{ t('dl.python.pip') }}</span>
                        <button type="button" class="copy-btn" data-copy="#cmd-pypi-pip" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                    </div>
                    <pre class="command-block__body" id="cmd-pypi-pip"><code>{{ $pypi['pip'] }}</code></pre>
                </div>

                <details class="download-advanced">
                    <x-download-more-options :icons="[
                        ['file' => 'python', 'label' => 'Python / pip'],
                        ['file' => 'poetry', 'label' => 'Poetry'],
                        ['file' => 'uv', 'label' => 'uv'],
                    ]" />
                    <div class="download-stack">
                        @foreach (['pipx', 'poetry', 'uv', 'uvx'] as $kind)
                            <div class="command-block">
                                <div class="command-block__header">
                                    <span>{{ t('dl.python.'.$kind) }}</span>
                                    <button type="button" class="copy-btn" data-copy="#cmd-pypi-{{ $kind }}" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                </div>
                                @if ($kind === 'uvx')
                                    <p class="download-panel__intro" style="padding:0.75rem 1.05rem 0;margin:0">{{ t('dl.python.uvx_hint') }}</p>
                                @endif
                                <pre class="command-block__body" id="cmd-pypi-{{ $kind }}"><code>{{ $pypi[$kind] }}</code></pre>
                            </div>
                        @endforeach

                        @if (is_string($wheelUrl) && $wheelUrl !== '')
                            <div>
                                <h3 class="download-panel__subhead">{{ t('dl.python.wheel_heading') }}</h3>
                                <p class="download-panel__intro">{{ t('dl.python.wheel_intro') }}</p>
                                @foreach (['pip' => "pip install {$wheelUrl}", 'pipx' => "pipx install {$wheelUrl}", 'poetry' => "poetry add {$wheelUrl}", 'uv' => "uv pip install {$wheelUrl}"] as $kind => $cmd)
                                    <div class="command-block">
                                        <div class="command-block__header">
                                            <span>{{ t('dl.python.'.$kind) }}</span>
                                            <button type="button" class="copy-btn" data-copy="#cmd-wheel-{{ $kind }}" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                                        </div>
                                        <pre class="command-block__body" id="cmd-wheel-{{ $kind }}"><code>{{ $cmd }}</code></pre>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </div>
                </details>
            </div>

            <div class="download-panel" id="android" data-download-panel="android" hidden>
                <h2 class="section__title">{{ t('dl.android.h2') }}</h2>
                <p class="download-panel__intro">{{ t('dl.android.friendly') }}</p>
                <h3 class="download-panel__subhead">{{ t('dl.android.apk_h3') }}</h3>
                @if (! $apkUrl)
                    <p class="download-panel__intro">{{ t('dl.android.intro') }}</p>
                    <p class="version-badge">{{ t('dl.android.badge') }}</p>
                @else
                    <div class="download-panel__actions">
                        <div class="download-artifact">
                            <x-download-checksum :sha256="$apkSha" />
                            <a class="btn btn--solid" href="{{ $apkUrl }}" download>
                                <x-icon name="download" size="xs" />
                                {{ t('dl.android.btn_apk') }}
                            </a>
                        </div>
                    </div>
                @endif
                <p>
                    <a href="{{ $site['obtainium_url'] }}" target="_blank" rel="noopener noreferrer">
                        <img src="/vendor/obtainium-badge.png" height="60" width="200" alt="{{ t('dl.android.obtainium_alt') }}">
                    </a>
                </p>

                <details class="download-advanced">
                    <summary>{{ t('dl.android.termux_h3') }}</summary>
                    <div class="download-stack">
                        <p class="download-panel__intro">{{ t('dl.termux.intro_before') }}<code>meshchat --headless</code>{{ t('dl.termux.intro_after') }}</p>
                        <div class="command-block">
                            <div class="command-block__header">
                                <span>{{ t('dl.termux.step1') }}</span>
                                <button type="button" class="copy-btn" data-copy="#cmd-termux-1" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                            </div>
                            <pre class="command-block__body" id="cmd-termux-1"><code>pkg upgrade
pkg install python
pkg install rust
pkg install binutils
pkg install build-essential</code></pre>
                        </div>
                        <div class="command-block">
                            <div class="command-block__header">
                                <span>{{ t('dl.termux.step2') }}</span>
                                <button type="button" class="copy-btn" data-copy="#cmd-termux-2" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                            </div>
                            <pre class="command-block__body" id="cmd-termux-2"><code>pip install reticulum-meshchatx</code></pre>
                        </div>
                        <div class="command-block">
                            <div class="command-block__header">
                                <span>{{ t('dl.termux.step3') }}</span>
                                <button type="button" class="copy-btn" data-copy="#cmd-termux-3" data-copied-label="{{ t('dl.python.copy') }}">{{ t('dl.python.copy') }}</button>
                            </div>
                            <pre class="command-block__body" id="cmd-termux-3"><code>meshchat --headless</code></pre>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    </section>
@endsection
