import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Box } from './Box';

/**
 * regression guard for the padding bug: motion's style pipeline mangles the `padding`
 * shorthand (renders empty values → zero side padding on every row/button it wraps),
 * so Box must emit longhands only. any future "shortcut" back to the shorthand will
 * break FocusRow/Card/Chip spacing on screen.
 */

function styleOf(markup: string): string {
  const match = markup.match(/style="([^"]*)"/);
  return match?.[1] ?? '';
}

describe('Box padding emission', () => {
  it('emits padding as longhands, never the shorthand', () => {
    const markup = renderToStaticMarkup(<Box padding="m">x</Box>);
    const style = styleOf(markup);
    expect(style).toContain('padding-left:var(--spacing-m)');
    expect(style).toContain('padding-top:var(--spacing-m)');
    expect(style).not.toMatch(/padding:var\(--spacing-m\)/);
  });

  it('lets paddingX/paddingY override the all-sides padding', () => {
    const markup = renderToStaticMarkup(
      <Box padding="m" paddingX="s" paddingY="l">
        x
      </Box>,
    );
    const style = styleOf(markup);
    expect(style).toContain('padding-left:var(--spacing-s)');
    expect(style).toContain('padding-right:var(--spacing-s)');
    expect(style).toContain('padding-top:var(--spacing-l)');
    expect(style).toContain('padding-bottom:var(--spacing-l)');
  });

  it('lets paddingTop/paddingBottom win over paddingY', () => {
    const markup = renderToStaticMarkup(
      <Box paddingY="l" paddingTop="xs">
        x
      </Box>,
    );
    const style = styleOf(markup);
    expect(style).toContain('padding-top:var(--spacing-xs)');
    expect(style).toContain('padding-bottom:var(--spacing-l)');
  });

  it('emits 0px for the none token', () => {
    const markup = renderToStaticMarkup(<Box padding="none">x</Box>);
    const style = styleOf(markup);
    expect(style).toContain('padding-left:0px');
    expect(style).not.toContain('padding-left:;');
  });

  it('never emits empty padding declarations', () => {
    const markup = renderToStaticMarkup(<Box padding="m">x</Box>);
    expect(styleOf(markup)).not.toContain('padding-top:;');
    expect(styleOf(markup)).not.toContain('padding-left:;');
  });
});
