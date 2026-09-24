export const SITE = {
  name: 'MeshChatX',
  domain: 'https://meshchatx.com',
  githubRepo: 'Quad4-Software/MeshChatX',
  githubUrl: 'https://github.com/Quad4-Software/MeshChatX',
  githubReleases: 'https://github.com/Quad4-Software/MeshChatX/releases',
  githubReleasesApi: 'https://api.github.com/repos/Quad4-Software/MeshChatX/releases',
  githubClone: 'https://github.com/Quad4-Software/MeshChatX.git',
  githubChangelogRaw:
    'https://raw.githubusercontent.com/Quad4-Software/MeshChatX/master/CHANGELOG.md',
  rngitRns: 'rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX',
  rngitNomadnet: '132f67e79d9b24aad014e93015fb858f:/page/repo.mu`g=public|r=MeshChatX',
  lavaforgeUrl: 'https://lavaforge.org/Reticulum-Things/MeshChatX',
  lavaforgeClone: 'https://lavaforge.org/Reticulum-Things/MeshChatX.git',
  pypiUrl: 'https://pypi.org/project/reticulum-meshchatx/',
  pypiPackage: 'reticulum-meshchatx',
  dockerHub: 'quad4io/meshchatx:latest',
  ghcr: 'ghcr.io/quad4-software/meshchatx:latest',
  umbrelUrl: 'https://apps.umbrel.com/app/meshchatx',
  flatpakCdnBase: 'https://cdn.quad4.io/flatpak',
  flatpakAppId: 'com.meshchatx.app',
  cdnBase: 'https://cdn.quad4.io',
  rnsDirectoryUrl: 'https://directory.rns.recipes/',
  rnsDirectoryApi:
    'https://directory.rns.recipes/api/directory/submitted?search=&type=&status=online',
  obtainiumUrl:
    'https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/Quad4-Software/MeshChatX',
  reticulumCrypto: 'https://reticulum.network/crypto.html',
  quad4Url: 'https://quad4.io/',
  themeKey: 'mcx-theme',
} as const;

export const CONTACT = {
  lxmf: 'f489752fbef161c64d65e385a4e9fc74',
  email: 'team@quad4.io',
} as const;

export const DONATE = {
  xmr: '8AfDSLVeTSt1oku5ifK4jkbJ94fp5kW6y5RWxuP1FYmyZmLHYRVSrPXJJaX7mK1n7MQUzwYE15uVdQVeAuWWnR5pDkN52xU',
  kofi: 'https://ko-fi.com/quad4',
  bmac: 'https://buymeacoffee.com/quad4',
} as const;

export const LOCALES = ['en', 'de', 'es', 'fi', 'fr', 'it', 'nl', 'ru', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Espanol',
  fi: 'Suomi',
  fr: 'Francais',
  it: 'Italiano',
  nl: 'Nederlands',
  ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
  zh: '\u4e2d\u6587',
};

export const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  fi: 'fi_FI',
  fr: 'fr_FR',
  it: 'it_IT',
  nl: 'nl_NL',
  ru: 'ru_RU',
  zh: 'zh_CN',
};

export const NAV_LINKS = [
  { key: 'nav.docs', path: 'docs' },
  { key: 'nav.download', path: 'download' },
  { key: 'nav.git', path: 'git' },
  { key: 'nav.contact', path: 'contact' },
] as const;

export const FOOTER_GROUPS = [
  {
    group: 'footer.product',
    links: [
      { key: 'nav.download', path: 'download' },
      { key: 'nav.docs', path: 'docs' },
      { key: 'nav.roadmap', path: 'roadmap' },
      { key: 'nav.git', path: 'git' },
    ],
  },
  {
    group: 'footer.explore',
    links: [
      { key: 'nav.interfaces', path: 'interfaces' },
      { key: 'nav.dependency', path: 'dependency' },
      { key: 'footer.changelog', path: 'changelog' },
      { key: 'nav.branding', path: 'branding' },
      { key: 'nav.donate', path: 'donate' },
      { key: 'nav.contact', path: 'contact' },
    ],
  },
  {
    group: 'footer.legal',
    links: [
      { key: 'footer.license', path: 'license' },
      { key: 'footer.privacy', path: 'privacy' },
    ],
  },
] as const;

export const SHOWCASE_TABS = [
  'tab-11-home',
  'tab-0-messages',
  'tab-1-contacts',
  'tab-2-calls',
  'tab-3-interfaces',
  'tab-4-map',
  'tab-5-nomadnet',
  'tab-6-visualizer',
  'tab-7-utilities',
  'tab-8-settings',
  'tab-9-identity',
  'tab-10-about',
] as const;

export const PLATFORMS = [
  { key: 'windows', icon: 'windows' },
  { key: 'macos', icon: 'apple' },
  { key: 'linux', icon: 'linux' },
  { key: 'android', icon: 'android' },
  { key: 'docker', icon: 'docker' },
  { key: 'python', icon: 'python' },
] as const;

export const CAPABILITIES = [
  'messaging',
  'rrc',
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
] as const;

export const DOCS_GROUPS = [
  {
    labelKey: 'docs.group.start',
    items: [
      'overview',
      'getting-started',
      'installation',
      'building',
      'development',
      'architecture',
    ],
  },
  {
    labelKey: 'docs.group.use',
    items: [
      'messaging',
      'audio-calls',
      'nomad-network',
      'interfaces',
      'tools',
      'identity-and-security',
      'plugins',
      'rns-link-api',
    ],
  },
  {
    labelKey: 'docs.group.authoring',
    items: ['nomadmesh-pages'],
  },
  {
    labelKey: 'docs.group.platforms',
    items: ['raspberry-pi', 'android-termux', 'quest-sidequest', 'linux-sandbox'],
  },
] as const;

export const DOCS_DEFAULT_SLUG = 'overview';
