export interface RoadmapItem {
  version: string;
  date: string;
  title: string;
  desc: string;
  features: string[];
  status: 'planned' | 'progress' | 'done' | 'upcoming';
}

export const ROADMAP: RoadmapItem[] = [
  {
    version: '4.7.0',
    date: 'June 2026',
    title: 'RRC Protocol, Multi-Pane UI, and RNSH Manager',
    desc: 'RRC is an IRC-style ephemeral chat protocol over Reticulum with hub-and-spoke rooms and CBOR wire encoding.',
    features: [
      'RRC protocol support (channels, hub-and-spoke, ephemeral messaging)',
      'Multi-pane chat layouts',
      'Nomadnet browser tabs',
      'RNSH session manager for multiple concurrent SSH-over-Reticulum sessions',
    ],
    status: 'planned',
  },
  {
    version: '4.8.0',
    date: 'July 2026',
    title: 'Visualiser, Plugins, and Platform Work',
    desc: 'RNS-over-HTTP, visualiser and startup work, plugins and RNX tooling, plus LXST audio, notifications, and container sandbox changes.',
    features: [
      'RNS-over-HTTP interface',
      'Visualiser updates (WASM + WebGL)',
      'Faster startup',
      'Battery use reductions',
      'Plugins',
      'RNX tool',
      'UI and styling fixes',
      'LXST half-duplex and PTT support',
      'In-app notification changes',
      'Seccomp-bpf and Landlock tuning',
      'Docker image layer changes',
    ],
    status: 'planned',
  },
  {
    version: '4.9.0',
    date: 'September 2026',
    title: 'Map, UI, and Codebase Cleanup',
    desc: 'Map updates, UI cleanup, RRC LXMFy bots, and codebase cleanup ahead of 5.0.0.',
    features: ['Map updates', 'UI cleanup', 'RRC LXMFy bots', 'Codebase cleanup'],
    status: 'planned',
  },
  {
    version: '5.0.0',
    date: 'December 2026',
    title: 'Svelte 5 UI, Offline Translation, and RNode Setup',
    desc: 'Svelte 5 UI rewrite is already underway and will replace the Vue 3 UI by 5.0.0. Same release adds offline WASM translation and RNode detection with auto-setup.',
    features: [
      'Svelte 5 UI rewrite (in progress, replacing Vue 3)',
      'Offline local translation tool (WASM)',
      'RNode detection and auto-setup',
    ],
    status: 'progress',
  },
];
