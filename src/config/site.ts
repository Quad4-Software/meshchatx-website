import brand from './site.json';

// Fork/rebrand surface: everything identity-specific lives in site.json.
// URLs below are derived so a fork edits one file.
const repo = brand.githubRepo;
const branch = brand.githubBranch;
const gh = `https://github.com/${repo}`;

export const SITE = {
  ...brand,
  slug: brand.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
  githubUrl: gh,
  githubReleases: `${gh}/releases`,
  githubReleasesApi: `https://api.github.com/repos/${repo}/releases`,
  githubClone: `${gh}.git`,
  githubChangelogRaw: `https://raw.githubusercontent.com/${repo}/${branch}/CHANGELOG.md`,
  githubChangelogBlob: `${gh}/blob/${branch}/CHANGELOG.md`,
  pypiUrl: `https://pypi.org/project/${brand.pypiPackage}/`,
  obtainiumUrl: `https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/${gh}`,
} as const;

export const CONTACT = brand.contact;
export const DONATE = brand.donate;

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
  { key: 'nav.news', path: 'news' },
  { key: 'nav.git', path: 'git' },
  { key: 'nav.contact', path: 'contact' },
] as const;

export const FOOTER_GROUPS = [
  {
    group: 'footer.product',
    links: [
      { key: 'nav.download', path: 'download' },
      { key: 'nav.docs', path: 'docs' },
      { key: 'nav.git', path: 'git' },
    ],
  },
  {
    group: 'footer.explore',
    links: [
      { key: 'nav.interfaces', path: 'interfaces' },
      { key: 'nav.news', path: 'news' },
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
  { key: 'windows', icon: 'mdiMicrosoftWindows', anchor: 'dl-win' },
  { key: 'macos', icon: 'mdiApple', anchor: 'dl-mac' },
  { key: 'linux', icon: 'mdiLinux', anchor: 'dl-linux' },
  { key: 'android', icon: 'mdiAndroid', anchor: 'dl-android' },
  { key: 'docker', icon: 'mdiDocker', anchor: 'dl-containers' },
  { key: 'python', icon: 'mdiLanguagePython', anchor: 'dl-python' },
  { key: 'flatpak', icon: 'siFlatpak', anchor: 'dl-flatpak' },
  { key: 'appimage', icon: 'siAppimage', anchor: 'dl-linux' },
  { key: 'podman', icon: 'img:/vendor/podman-logo.webp', anchor: 'dl-containers' },
] as const;

export const HOME_FEATURES = [
  { h: 'home.feature.crypto_h3', p: 'home.feature.crypto_p', icon: 'mdiShieldCheck' },
  { h: 'home.feature.no_cloud_h3', p: 'home.feature.no_cloud_p', icon: 'mdiServerOff' },
  { h: 'home.feature.no_account_h3', p: 'home.feature.no_account_p', icon: 'mdiIncognito' },
  { h: 'home.feature.tunnels_h3', p: 'home.feature.tunnels_p', icon: 'mdiTunnel' },
  { h: 'home.feature.local_h3', p: 'home.feature.local_p', icon: 'mdiFolderHome' },
  { h: 'home.feature.source_h3', p: 'home.feature.source_p', icon: 'mdiSourceBranch' },
] as const;

export const BRAND_COLORS = [
  { name: 'Void 900', hex: '#0a0a0b' },
  { name: 'Void 850', hex: '#101013' },
  { name: 'Void 700', hex: '#1f1f24' },
  { name: 'Mist 400', hex: '#a1a1aa' },
  { name: 'Paper 100', hex: '#f4f4f5' },
  { name: 'Paper 50', hex: '#fafafa' },
  { name: 'Accent Blue', hex: '#2563eb' },
] as const;

export const BRAND_SECTIONS = [
  { key: 'lockup', h: 'branding.lockup_h2', lead: 'branding.lockup_lead', sizes: ['40', '64', '80', '128', '256'], svg: 'lockup.svg' },
  { key: 'logo', h: 'branding.logo_h2', lead: 'branding.logo_lead', sizes: ['16', '32', '48', '64', '128', '256', '512', '800'] },
  { key: 'wordmark', h: 'branding.wordmark_h2', lead: 'branding.wordmark_lead', sizes: ['32', '40', '64', '80', '128'] },
  { key: 'icon', h: 'branding.icon_h2', lead: 'branding.icon_lead', sizes: ['16', '32', '48', '64', '128', '256', '512', '800'], extra: 'favicon.ico' },
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
