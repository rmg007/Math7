/**
 * mathlive.d.ts
 * Type declarations for the MathLive <math-field> web component.
 * Provides just what we need for the Symbol Matrix popover integration.
 */

declare namespace JSX {
  interface IntrinsicElements {
    'math-field': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        value?: string;
        'virtual-keyboard-mode'?: 'off' | 'onfocus' | 'manual';
        'smart-fence'?: 'on' | 'off';
        'math-mode-space'?: string;
        onInput?: (event: Event) => void;
      },
      HTMLElement
    >;
  }
}

interface MathFieldElement extends HTMLElement {
  value: string;
  setValue(latex: string, options?: { insertionMode?: string }): void;
}
