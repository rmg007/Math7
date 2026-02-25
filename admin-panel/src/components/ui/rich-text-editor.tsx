import { cn } from '@/lib/utils';
import Placeholder from '@tiptap/extension-placeholder';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Bold,
  Code,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Sparkles,
  Subscript,
  Superscript,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BlockMath, InlineMath } from './math-extensions';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={cn(
      'p-2 rounded-xl transition-all duration-300 transform active:scale-95',
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600',
      disabled && 'opacity-20 cursor-not-allowed grayscale'
    )}
  >
    {children}
  </button>
);

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathExpression, setMathExpression] = useState('');
  const [mathMode, setMathMode] = useState<'inline' | 'block'>('inline');
  const [mathPreviewHtml, setMathPreviewHtml] = useState('');
  const [mathError, setMathError] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState<{ rows: number; cols: number }>({
    rows: 0,
    cols: 0,
  });
  const mathFieldContainerRef = useRef<HTMLDivElement>(null);

  interface MathFieldElement extends HTMLElement {
    value: string;
    insert: (latex: string) => void;
  }
  const mathFieldRef = useRef<MathFieldElement | null>(null);

  // Sync quick-snippet / external changes into the math-field web component
  useEffect(() => {
    const el = mathFieldRef.current;
    if (el && 'value' in el && el.value !== mathExpression) {
      el.value = mathExpression;
    }
  }, [mathExpression]);

  // Dynamically load MathLive and mount the <math-field> web component imperatively
  // This avoids React JSX type issues with custom elements
  useEffect(() => {
    const container = mathFieldContainerRef.current;
    if (!container) return;

    import('mathlive')
      .then(() => {
        // MathLive self-registers <math-field> as a custom element
        if (container.querySelector('math-field')) return; // already mounted

        const mathField = document.createElement('math-field') as HTMLElement & {
          value: string;
          virtualKeyboardMode: string;
          insert: (latex: string) => void;
        };
        mathField.style.flex = '1';
        mathField.style.padding = '10px 16px';
        mathField.style.border = '1px solid #eef2ff';
        mathField.style.borderRadius = '12px';
        mathField.style.background = 'rgba(249,250,251,0.5)';
        mathField.style.fontSize = '14px';
        mathField.style.minHeight = '44px';
        mathField.style.setProperty('--caret-color', '#6366f1');
        mathField.style.setProperty('--selection-background-color', 'rgba(99,102,241,0.15)');
        mathField.setAttribute('virtual-keyboard-mode', 'off');
        mathField.setAttribute('smart-fence', 'on');

        mathField.addEventListener('input', (e: Event) => {
          const target = e.target as HTMLElement & { value: string };
          // Use the setter from the ref stored on the container
          const handler = (container as HTMLDivElement & { _onChange?: (v: string) => void })
            ._onChange;
          if (handler) handler(target.value);
        });

        mathField.addEventListener('keydown', (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter') {
            ke.preventDefault();
            const handler = (container as HTMLDivElement & { _onEnter?: () => void })._onEnter;
            if (handler) handler();
          }
        });

        container.appendChild(mathField);
        mathFieldRef.current = mathField;
      })
      .catch(() => {
        /* MathLive load failed, no-op */
      });

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [showMathInput]); // re-run when popover opens

  // Keep imperative event handlers current without re-running the effect
  useEffect(() => {
    const container = mathFieldContainerRef.current as
      | (HTMLDivElement & {
          _onChange?: (v: string) => void;
          _onEnter?: () => void;
        })
      | null;
    if (!container) return;
    container._onChange = handleMathExpressionChange;
    container._onEnter = insertMath;
  });

  const insertSnippet = (latex: string) => {
    const mf = mathFieldRef.current;
    if (mf && typeof mf.insert === 'function') {
      mf.insert(latex);
      // mf.insert() triggers the 'input' event, which updates state.
      // But we call handleMathExpressionChange to ensure state and preview are sync'd
      // MathLive's internal state update is usually faster.
    } else {
      handleMathExpressionChange(mathExpression + latex);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
      Underline,
      InlineMath,
      BlockMath,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const renderMathPreview = useCallback((expr: string, display: boolean) => {
    if (!expr.trim()) {
      setMathPreviewHtml('');
      setMathError('');
      return;
    }
    try {
      const html = katex.renderToString(expr, { throwOnError: true, displayMode: display });
      setMathPreviewHtml(html);
      setMathError('');
    } catch (e: unknown) {
      setMathPreviewHtml('');
      setMathError(e instanceof Error ? e.message : 'Invalid LaTeX');
    }
  }, []);

  const handleMathExpressionChange = (expr: string) => {
    setMathExpression(expr);
    renderMathPreview(expr, mathMode === 'block');
  };

  const handleMathModeChange = (mode: 'inline' | 'block') => {
    setMathMode(mode);
    renderMathPreview(mathExpression, mode === 'block');
  };

  const insertMath = () => {
    if (!mathExpression.trim() || !editor) return;

    // Validate with KaTeX before inserting
    try {
      katex.renderToString(mathExpression, {
        throwOnError: true,
        displayMode: mathMode === 'block',
      });
    } catch {
      setMathError('Cannot render this expression. Check your LaTeX syntax.');
      return;
    }

    if (mathMode === 'inline') {
      const node = editor.schema.nodes.inlineMath?.create({ latex: mathExpression });
      if (node) {
        editor.chain().focus().insertContent(node.toJSON()).run();
      }
    } else {
      const node = editor.schema.nodes.blockMath?.create({ latex: mathExpression });
      if (node) {
        editor.chain().focus().insertContent(node.toJSON()).run();
      }
    }

    setMathExpression('');
    setMathPreviewHtml('');
    setMathError('');
    setShowMathInput(false);
  };

  const insertFraction = () => {
    if (editor) {
      // Insert a proper inline math node for \frac
      const node = editor.schema.nodes.inlineMath?.create({ latex: '\\frac{a}{b}' });
      if (node) {
        editor.chain().focus().insertContent(node.toJSON()).run();
      }
    }
  };

  const insertSuperscript = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      if (from === to) {
        editor.chain().focus().insertContent('<sup>x</sup>').run();
      } else {
        const selectedText = editor.state.doc.textBetween(from, to);
        editor.chain().focus().deleteSelection().insertContent(`<sup>${selectedText}</sup>`).run();
      }
    }
  };

  const insertSubscript = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      if (from === to) {
        editor.chain().focus().insertContent('<sub>x</sub>').run();
      } else {
        const selectedText = editor.state.doc.textBetween(from, to);
        editor.chain().focus().deleteSelection().insertContent(`<sub>${selectedText}</sub>`).run();
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative rounded-[1.5rem] border border-indigo-100/50 shadow-xl shadow-indigo-500/5 transition-all focus-within:border-indigo-400 focus-within:ring-8 focus-within:ring-indigo-500/5',
        className
      )}
    >
      {/* Background with blur - moved to separate layer to avoid clipping issues with fixed children */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-[1.5rem] -z-10 pointer-events-none" />

      <div className="relative z-0 rounded-[1.5rem] overflow-visible">
        <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-indigo-50 bg-white/40 backdrop-blur-md">
          {/* --- Text formatting --- */}
          <MenuButton
            onClick={() => {
              editor.chain().focus().toggleBold().run();
            }}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-indigo-100 mx-1.5" />

          {/* --- Block formatting --- */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading (Ctrl+Alt+2)"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-indigo-100 mx-1.5" />

          {/* --- Math shortcuts --- */}
          {/* --- Table picker --- */}
          <div className="relative">
            <MenuButton
              onClick={() => {
                setShowTablePicker(!showTablePicker);
                setTableHover({ rows: 0, cols: 0 });
              }}
              isActive={showTablePicker}
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4" />
            </MenuButton>

            {showTablePicker && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
                <div
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                  onClick={() => setShowTablePicker(false)}
                />

                <div
                  className={cn(
                    'p-6 bg-white border border-indigo-100 shadow-2xl shadow-indigo-500/20 z-[1001] animate-in zoom-in-95 duration-200 pointer-events-auto',
                    'overflow-y-auto max-h-[80vh] translate-z-0 rounded-[2rem] w-full max-w-[300px] relative'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setShowTablePicker(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {tableHover.rows > 0
                      ? `${tableHover.rows} × ${tableHover.cols}`
                      : 'Insert Table'}
                  </p>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 36 }, (_, i) => {
                      const row = Math.floor(i / 6) + 1;
                      const col = (i % 6) + 1;
                      const isHighlighted = row <= tableHover.rows && col <= tableHover.cols;
                      return (
                        <button
                          key={i}
                          type="button"
                          title={`Insert ${row}x${col} table`}
                          onMouseEnter={() => setTableHover({ rows: row, cols: col })}
                          onClick={() => {
                            editor
                              .chain()
                              .focus()
                              .insertTable({ rows: row, cols: col, withHeaderRow: true })
                              .run();
                            setShowTablePicker(false);
                            setTableHover({ rows: 0, cols: 0 });
                          }}
                          className={cn(
                            'w-5 h-5 rounded border transition-all',
                            isHighlighted
                              ? 'bg-indigo-500 border-indigo-400'
                              : 'bg-gray-50 border-gray-200 hover:bg-indigo-100'
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-indigo-100 mx-1.5" />

          <MenuButton onClick={insertSuperscript} title="Superscript (x²)">
            <Superscript className="h-4 w-4" />
          </MenuButton>

          <MenuButton onClick={insertSubscript} title="Subscript (x₂)">
            <Subscript className="h-4 w-4" />
          </MenuButton>

          <MenuButton onClick={insertFraction} title="Fraction (a/b) — inserts \frac{a}{b}">
            <span className="text-xs font-black italic tracking-tighter">1/2</span>
          </MenuButton>

          <div className="w-px h-6 bg-indigo-100 mx-1.5" />

          {/* --- Undo / Redo --- */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-indigo-100 mx-1.5" />

          {/* --- Symbol Matrix / LaTeX Popover --- */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMathInput(!showMathInput)}
              className={cn(
                'px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 border shadow-sm',
                showMathInput
                  ? 'bg-indigo-600 text-white border-indigo-400 rotate-1 scale-105'
                  : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
              )}
              title="Insert Math — type $...$ inline or $$...$$ for display mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Symbol Matrix
            </button>

            {showMathInput && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
                {/* Universal backdrop shadow */}
                <div
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                  onClick={() => setShowMathInput(false)}
                />

                <div
                  data-testid="symbol-matrix-palette"
                  className={cn(
                    'bg-white border border-indigo-100 shadow-2xl shadow-indigo-500/20 z-[1001] animate-in zoom-in-95 duration-200 pointer-events-auto',
                    'overflow-y-auto max-h-[90vh] translate-z-0',
                    'w-full max-w-[calc(100vw-32px)] sm:max-w-[400px] rounded-[2rem] p-6 relative'
                  )}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setShowMathInput(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white scale-90">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Symbol Palette
                    </p>
                  </div>

                  {/* Symbol grid */}
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {[
                      'π',
                      '√',
                      '∑',
                      '∞',
                      '≠',
                      '≤',
                      '≥',
                      '±',
                      '×',
                      '÷',
                      '°',
                      'α',
                      'β',
                      'θ',
                      'Δ',
                    ].map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().insertContent(symbol).run();
                          setShowMathInput(false);
                        }}
                        className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 text-lg transition-all active:scale-90"
                        title={`Insert ${symbol}`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>

                  {/* LaTeX Engine */}
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    {/* Inline / Block mode toggle */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMathModeChange('inline')}
                        className={cn(
                          'flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all',
                          mathMode === 'inline'
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'text-gray-400 border-gray-100 hover:border-indigo-200'
                        )}
                        title="Inline Mode ($...$)"
                      >
                        Inline $…$
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMathModeChange('block')}
                        className={cn(
                          'flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all',
                          mathMode === 'block'
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'text-gray-400 border-gray-100 hover:border-indigo-200'
                        )}
                        title="Block Mode ($$...$$)"
                      >
                        Block $$…$$
                      </button>
                    </div>

                    {/* Input row — MathLive WYSIWYG */}
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                        Visual Math Editor
                      </label>
                      <div className="flex gap-2 items-center">
                        {/* MathLive mounts <math-field> imperatively into this container */}
                        <div ref={mathFieldContainerRef} className="flex-1" />
                        {/* Apply button */}
                        <button
                          type="button"
                          onClick={insertMath}
                          disabled={!mathExpression.trim() || Boolean(mathError)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-20 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                          title="Apply LaTeX"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Live preview */}
                    {mathPreviewHtml && (
                      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-100/50 text-center animate-in fade-in duration-300">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">
                          Preview
                        </p>
                        <div
                          className="text-indigo-900"
                          dangerouslySetInnerHTML={{ __html: mathPreviewHtml }}
                        />
                      </div>
                    )}

                    {mathError && (
                      <p className="px-3 py-2 bg-red-50 text-red-500 text-[10px] font-bold rounded-xl border border-red-100 italic animate-pulse">
                        {mathError}
                      </p>
                    )}

                    {/* Quick-insert snippets */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {[
                        { label: 'x²', tex: 'x^2' },
                        { label: 'a/b', tex: '\\frac{a}{b}' },
                        { label: '√x', tex: '\\sqrt{x}' },
                        { label: 'Σ', tex: '\\sum_{i=1}^{n}' },
                        { label: '∫', tex: '\\int_0^\\infty f(x)\\,dx' },
                        { label: 'lim', tex: '\\lim_{x\\to\\infty}' },
                      ].map(({ label, tex }) => (
                        <button
                          key={tex}
                          type="button"
                          onClick={() => insertSnippet(tex)}
                          className="px-3 py-2 text-[10px] font-black border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 text-gray-500 transition-all active:scale-95"
                          title={`Insert ${label} snippet`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tip */}
                    <p className="text-[8px] text-gray-300 font-medium pt-1">
                      Tip: type <span className="font-black text-indigo-300">$…$</span> inline or{' '}
                      <span className="font-black text-indigo-300">$$…$$</span> anywhere to
                      auto-convert.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 min-h-[160px] relative">
          <EditorContent editor={editor} className="prose-indigo prose-lg" />
        </div>
      </div>
    </div>
  );
}
