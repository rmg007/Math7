import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading2,
  Undo,
  Redo,
  Superscript,
  Subscript
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title
}: { 
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded hover:bg-gray-200 transition-colors",
      isActive && "bg-purple-100 text-purple-700",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
)

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [showMathInput, setShowMathInput] = useState(false)
  const [mathExpression, setMathExpression] = useState('')

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
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const insertMath = () => {
    if (mathExpression && editor) {
      const mathHtml = `<span class="math-inline" data-math="${mathExpression}">[${mathExpression}]</span>`
      editor.chain().focus().insertContent(mathHtml).run()
      setMathExpression('')
      setShowMathInput(false)
    }
  }

  const insertFraction = () => {
    if (editor) {
      editor.chain().focus().insertContent('<sup>a</sup>/<sub>b</sub>').run()
    }
  }

  const insertSuperscript = () => {
    if (editor) {
      const { from, to } = editor.state.selection
      if (from === to) {
        editor.chain().focus().insertContent('<sup>x</sup>').run()
      } else {
        const selectedText = editor.state.doc.textBetween(from, to)
        editor.chain().focus().deleteSelection().insertContent(`<sup>${selectedText}</sup>`).run()
      }
    }
  }

  const insertSubscript = () => {
    if (editor) {
      const { from, to } = editor.state.selection
      if (from === to) {
        editor.chain().focus().insertContent('<sub>x</sub>').run()
      } else {
        const selectedText = editor.state.doc.textBetween(from, to)
        editor.chain().focus().deleteSelection().insertContent(`<sub>${selectedText}</sub>`).run()
      }
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-md bg-white", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading"
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

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <MenuButton
          onClick={insertSuperscript}
          title="Superscript (x²)"
        >
          <Superscript className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={insertSubscript}
          title="Subscript (x₂)"
        >
          <Subscript className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={insertFraction}
          title="Fraction (a/b)"
        >
          <span className="text-sm font-medium">⅟</span>
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />
        
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

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMathInput(!showMathInput)}
            className="px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            title="Insert Math Symbol"
          >
            π √ ∑
          </button>
          
          {showMathInput && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white border rounded-lg shadow-lg z-50 min-w-[280px]">
              <p className="text-xs text-gray-500 mb-2">Common Math Symbols (click to insert):</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {['π', '√', '∑', '∞', '≠', '≤', '≥', '±', '×', '÷', '°', 'α', 'β', 'θ', 'Δ'].map(symbol => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertContent(symbol).run()
                      setShowMathInput(false)
                    }}
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-purple-100 text-lg"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-gray-500 mb-1">Custom expression:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mathExpression}
                    onChange={(e) => setMathExpression(e.target.value)}
                    placeholder="e.g., x² + y²"
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={insertMath}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <EditorContent editor={editor} />
    </div>
  )
}
