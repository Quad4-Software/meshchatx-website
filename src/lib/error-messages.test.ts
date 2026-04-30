import { describe, expect, it } from 'vitest';
import { resolveErrorCopy, rootErrorCopy } from './error-messages';

describe('error-messages', () => {
  it('resolveErrorCopy uses translate', () => {
    const t = (k: string) => (k === 'error.title_404' ? 'T' : 'L');
    expect(resolveErrorCopy(404, t)).toEqual({ title: 'T', lead: 'L' });
  });

  it('rootErrorCopy covers status bands', () => {
    expect(rootErrorCopy(404).title).toContain('not found');
    expect(rootErrorCopy(418).title).toContain('could not be completed');
    expect(rootErrorCopy(500).title).toContain('went wrong');
  });
});
