/// <reference types="astro/client" />
/// <reference types="vite/client" />

declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    bgcolor?: string | undefined;
    bordercolor?: string | undefined;
    text?: string | undefined;
    link?: string | undefined;
    vlink?: string | undefined;
    border?: string | undefined;
    cellpadding?: string | undefined;
    cellspacing?: string | undefined;
  }
}
