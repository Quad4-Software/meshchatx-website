/** Public GitHub mirror for MeshChatX app source, changelog, and release browser pages. */
export const MESHCHATX_GITHUB =
  "https://github.com/Quad4-Software/MeshChatX" as const;
export const MESHCHATX_RELEASES = `${MESHCHATX_GITHUB}/releases` as const;
export const MESHCHATX_CHANGELOG =
  `${MESHCHATX_GITHUB}/blob/master/CHANGELOG.md` as const;
/** `git clone` remote (HTTPS). */
export const MESHCHATX_CLONE_URL = `${MESHCHATX_GITHUB}.git` as const;
export const MESHCHATX_PKGBUILD =
  `${MESHCHATX_GITHUB}/blob/master/packaging/arch/PKGBUILD` as const;
