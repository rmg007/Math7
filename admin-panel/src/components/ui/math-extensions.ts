/**
 * math-extensions.ts
 *
 * Custom TipTap Node extensions for inline ($...$) and block ($$...$$) LaTeX.
 * Uses KaTeX for rendering. Nodes are atomic (non-editable), store the raw
 * LaTeX source in a `data-latex` attribute so content survives save/reload.
 */

import { InputRule, Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

// ---------------------------------------------------------------------------
// InlineMath — renders inside a paragraph, like $x^2 + y^2 = r^2$
// ---------------------------------------------------------------------------

export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true, // non-editable, treated as a single unit

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') ?? '',
        renderHTML: (attributes: { latex: string }) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex-inline]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const latex: string = HTMLAttributes['data-latex'] ?? '';
    let rendered = '';
    try {
      rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      rendered = `<span class="math-error">${latex}</span>`;
    }

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-latex-inline': '',
        'data-latex': latex,
        contenteditable: 'false',
        class: 'math-inline',
      }),
      // TipTap requires text content for atom nodes in renderHTML. We use a
      // raw HTML trick: render via nodeViews instead (see addNodeView below).
      // This renderHTML is used for copy/paste and storage serialization only.
      ['span', { innerHTML: rendered }],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-latex-inline', '');
      dom.setAttribute('data-latex', node.attrs.latex as string);
      dom.setAttribute('contenteditable', 'false');
      dom.className =
        'math-inline cursor-pointer select-none hover:ring-2 hover:ring-indigo-300 rounded-sm transition-all';

      try {
        katex.render(node.attrs.latex as string, dom, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        dom.textContent = node.attrs.latex as string;
      }

      return { dom };
    };
  },

  /**
   * InputRule: typing $expression$ auto-converts to an InlineMath node.
   * Captures everything between a leading $ and a closing $ (not $$).
   */
  addInputRules() {
    return [
      new InputRule({
        find: /(?<!\$)\$([^$\n]+)\$(?!\$)/,
        handler: ({ range, match, chain }) => {
          const latex = match[1];
          if (!latex) return null;

          const nodeJSON = { type: 'inlineMath', attrs: { latex } };
          chain().deleteRange(range).insertContentAt(range.from, nodeJSON).run();
        },
      }),
    ];
  },
});

// ---------------------------------------------------------------------------
// BlockMath — full-width display math, like $$\int_0^\infty f(x)dx$$
// ---------------------------------------------------------------------------

export const BlockMath = Node.create({
  name: 'blockMath',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') ?? '',
        renderHTML: (attributes: { latex: string }) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-latex-block]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const latex: string = HTMLAttributes['data-latex'] ?? '';
    let rendered = '';
    try {
      rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      rendered = `<span class="math-error">${latex}</span>`;
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-latex-block': '',
        'data-latex': latex,
        contenteditable: 'false',
        class: 'math-block',
      }),
      ['span', { innerHTML: rendered }],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-latex-block', '');
      dom.setAttribute('data-latex', node.attrs.latex as string);
      dom.setAttribute('contenteditable', 'false');
      dom.className =
        'math-block my-3 py-3 px-4 bg-indigo-50/50 rounded-xl text-center cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all';

      try {
        katex.render(node.attrs.latex as string, dom, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        dom.textContent = node.attrs.latex as string;
      }

      return { dom };
    };
  },

  /**
   * InputRule: typing $$expression$$ auto-converts to a BlockMath node.
   * Matches $$...$$ spanning up to one line.
   */
  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$\n]+)\$\$/,
        handler: ({ range, match, chain }) => {
          const latex = match[1];
          if (!latex) return null;

          const nodeJSON = { type: 'blockMath', attrs: { latex } };
          chain().deleteRange(range).insertContentAt(range.from, nodeJSON).run();
        },
      }),
    ];
  },
});
