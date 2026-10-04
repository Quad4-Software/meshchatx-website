import { marked, type Tokens } from 'marked';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

marked.use({
  renderer: {
    // Images in upstream markdown are often syntax examples (![alt](src)) or
    // hot-links. Emit a link for absolute URLs and show the literal markdown
    // otherwise, so no broken or unsized <img> ever reaches the page.
    image({ href, title, text }: Tokens.Image): string {
      const alt = esc(text || '');
      if (/^https?:\/\//i.test(href)) {
        const t = title ? ` title="${esc(title)}"` : '';
        return `<a href="${esc(href)}"${t} target="_blank" rel="noopener noreferrer">${alt || esc(href)}</a>`;
      }
      return `<code>![${alt}](${esc(href)})</code>`;
    },
  },
});

export function renderMarkdown(body: string): string {
  return marked.parse(body) as string;
}
