export type RoadmapStatus = "done" | "progress" | "planned" | "upcoming";

export interface Feature {
  text: string;
  highlight?: boolean;
}

export interface RoadmapItem {
  version: string;
  date: string;
  title: string;
  desc: string;
  features: Feature[];
  status: RoadmapStatus;
  notice?: string;
}

export const roadmapItemsBase: RoadmapItem[] = [
  {
    version: "4.7.0",
    date: "June 2026",
    title: "RRC Protocol, Multi-Pane UI, and RNSH Manager",
    desc: "RRC is an IRC-style ephemeral chat protocol over Reticulum with hub-and-spoke rooms and CBOR wire encoding.",
    features: [
      {
        text: "RRC protocol support (channels, hub-and-spoke, ephemeral messaging)",
      },
      { text: "Multi-pane chat layouts" },
      { text: "Nomadnet browser tabs" },
      {
        text: "RNSH session manager for multiple concurrent SSH-over-Reticulum sessions",
      },
    ],
    status: "planned",
  },
  {
    version: "4.8.0",
    date: "July 2026",
    title: "Visualiser, Plugins, and Platform Tuning",
    desc: "RNS-over-HTTP, visualiser and startup gains, plugins and RNX tooling, plus LXST audio, notifications, and container hardening work.",
    features: [
      { text: "RNS-over-HTTP interface" },
      { text: "Visualiser Improvements (WASM + WebGL)" },
      { text: "Faster startup" },
      { text: "Battery optimizations" },
      { text: "Plugins" },
      { text: "RNX tool" },
      { text: "UI and styling fixes" },
      { text: "LXST half-duplex and PTT support" },
      { text: "In-App Notifications changes" },
      { text: "Seccomp-bpf and Landlock tuning" },
      { text: "Docker image layer improvements" },
    ],
    status: "planned",
  },
  {
    version: "4.9.0",
    date: "August 2026",
    title: "Map, UX, and Maintainability",
    desc: "Map and UX improvements, RRC LXMFy bots, and work to increase maintainability across the codebase.",
    features: [
      { text: "Map improvements" },
      { text: "Better UX" },
      { text: "RRC LXMFy bots" },
      { text: "Increasing maintainability" },
    ],
    status: "planned",
  },
  {
    version: "5.0.0",
    date: "September 2026",
    title: "Final Feature Release",
    desc: "The last feature-focused release. After 5.0.0, MeshChatX will enter maintenance mode with only security, bug, and performance fixes, Electron updates, and dependency bumps.",
    features: [],
    status: "planned",
  },
];

export function resolveRoadmapItems(
  items: RoadmapItem[],
  publishedVersions: Set<string>,
): RoadmapItem[] {
  return items.map((item) => {
    if (item.status !== "planned") return item;
    if (publishedVersions.has(item.version)) {
      return { ...item, status: "done" };
    }
    return item;
  });
}
