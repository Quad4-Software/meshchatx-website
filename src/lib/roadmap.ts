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

export const roadmapItems: RoadmapItem[] = [
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
    title: "RNS Tunnel, Filesync, and Remote Management",
    desc: "Tunneling and peer-to-peer file synchronisation, plus remote management tools for administering mesh nodes and clients from a single interface.",
    features: [
      { text: "RNS tunneling for TCP and UDP traffic over Reticulum" },
      { text: "Peer-to-peer file synchronisation" },
      { text: "Remote management tools" },
      { text: "Easier RNode flashing workflows" },
      { text: "Map improvements" },
    ],
    status: "planned",
  },
  {
    version: "4.9.0",
    date: "August 2026",
    title: "Modular Code and Restructure",
    desc: "Major internal restructure to make the codebase more modular, maintainable, and easier to fork, along with performance and memory optimizations.",
    features: [{ text: "Performance and memory optimizations" }],
    status: "planned",
  },
  {
    version: "5.0.0",
    date: "September 2026",
    title: "Final Feature Release",
    desc: "The last feature-focused release. After 5.0.0, MeshChatX will enter maintenance mode with only security, bug, and performance fixes, Electron updates, and dependency bumps.",
    features: [
      { text: "Group calling over Reticulum", highlight: true },
      { text: "Group messaging", highlight: true },
    ],
    notice:
      "Group features are awaiting official group calling and messaging support in RNS, LXMF, and LXST before they can be implemented.",
    status: "planned",
  },
];
