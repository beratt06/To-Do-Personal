import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Type, List, ListOrdered, CheckSquare, Bold, Italic, Strikethrough } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";

export type Note = {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
};

const MenuBar = ({ editor }: { editor: any }) => {
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

export default function NotesTab({ playSound }: { playSound: (type: "pop" | "dink" | "delete") => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("focusflow-notes");
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed);
      if (parsed.length > 0) setActiveNoteId(parsed[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("focusflow-notes", JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const activeNote = notes.find(n => n.id === activeNoteId);

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
        placeholder: 'Notunu buraya yazmaya başla...',
      }),
    ],
    content: activeNote ? activeNote.content : '',
    onUpdate: ({ editor }) => {
      if (!activeNoteId) return;
      const html = editor.getHTML();
      updateNote(activeNoteId, { content: html });
    },
  });

  useEffect(() => {
    if (editor && activeNote && editor.getHTML() !== activeNote.content) {
      editor.commands.setContent(activeNote.content);
    }
  }, [activeNoteId, editor]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "İsimsiz Not",
      content: "",
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    playSound("dink");
    
    // Focus after short delay
    setTimeout(() => {
      editor?.commands.focus();
    }, 100);
  };

  const updateNote = (id: number, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };

  const deleteNote = (id: number) => {
    if (!confirm("Bu notu kalıcı olarak silmek istediğine emin misin?")) return;
    playSound("delete");
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-[calc(100vh-140px)] min-h-[600px] mt-4">
      <aside className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line bg-page/50">
          <button type="button" onClick={createNote} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md">
            <Plus size={18} /> Yeni Not
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center p-6 text-sm text-muted">Henüz hiç notun yok. Yeni bir not oluşturarak başla.</div>
          ) : (
            notes.map(note => (
              <button 
                type="button"
                key={note.id} 
                onClick={() => setActiveNoteId(note.id)}
                className={`group flex w-full flex-col text-left rounded-xl px-4 py-3 transition-all ${activeNoteId === note.id ? "bg-selected border-line/50 border shadow-sm" : "hover:bg-hover border border-transparent"}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className={`font-semibold truncate text-sm flex-1 ${activeNoteId === note.id ? "text-ink" : "text-ink/80"}`}>
                    {note.title || "İsimsiz Not"}
                  </span>
                  <div onClick={e => { e.stopPropagation(); deleteNote(note.id); }} className={`p-1.5 shrink-0 rounded text-muted hover:text-danger hover:bg-danger-subtle transition-colors ${activeNoteId === note.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} title="Notu Sil">
                    <Trash2 size={14} />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted mt-1 truncate">
                  {new Date(note.updatedAt).toLocaleDateString('tr-TR')}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm relative">
        {activeNote ? (
          <>
            <div className="px-8 pt-8 pb-4 bg-card z-0">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                placeholder="Not Başlığı"
                className="w-full bg-transparent text-4xl font-bold text-ink outline-none placeholder:text-muted/40 transition-colors focus:placeholder:text-muted/20"
              />
            </div>
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto p-8 scrollbar cursor-text" onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} className="tiptap-editor h-full" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 text-center">
            <div className="mb-4 p-5 rounded-full bg-line/30">
              <Edit3 size={32} className="text-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-ink/70 mb-2">Not Defteri</h3>
            <p className="text-sm font-medium">Sol taraftan bir not seçin veya yeni bir tane oluşturun.</p>
          </div>
        )}
      </section>
    </div>
  );
}
