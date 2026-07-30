import { useEffect } from "react";
import { Bold, Italic, Strikethrough, List, ListOrdered, CheckSquare } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";

export const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line bg-page/50 p-2 sticky top-0 z-10 backdrop-blur-sm">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Kalın"><Bold size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="İtalik"><Italic size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Üstü Çizili"><Strikethrough size={16} /></button>
      
      <div className="w-px h-5 bg-line mx-1" />
      
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Başlık 1">H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Başlık 2">H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Başlık 3">H3</button>
      
      <div className="w-px h-5 bg-line mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Madde İşaretli Liste"><List size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Numaralı Liste"><ListOrdered size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('taskList') ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`} title="Görev Listesi"><CheckSquare size={16} /></button>
    </div>
  );
};

export default function RichEditor({ content, onChange, placeholder = "Bir şeyler yazın..." }: { content: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full relative">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto p-6 scrollbar cursor-text min-h-[300px]" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} className="tiptap-editor h-full" />
      </div>
    </div>
  );
}
