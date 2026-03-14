import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold, Italic, UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Link2, Image as ImageIcon, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TiptapEditorProps {
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: placeholder || 'Schrijf hier de inhoud...' }),
    ],
    content: (() => {
      try { return content ? JSON.parse(content) : ''; }
      catch { return content || ''; }
    })(),
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  // Sync external content changes (e.g. on block switch)
  useEffect(() => {
    if (!editor || !content) return;
    try {
      const json = JSON.parse(content);
      const current = JSON.stringify(editor.getJSON());
      if (current !== content) {
        editor.commands.setContent(json, { emitUpdate: false });
      }
    } catch { /* plain text fallback — don't replace */ }
  }, [content]);

  const handleSetLink = useCallback(() => {
    if (!linkUrl) { editor?.chain().focus().unsetLink().run(); }
    else { editor?.chain().focus().setLink({ href: linkUrl }).run(); }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('lesson-images')
        .upload(filename, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('lesson-images').getPublicUrl(filename);
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch {
      toast.error('Afbeelding uploaden mislukt. Controleer of de storage bucket bestaat.');
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, disabled, children, title }: {
    onClick: () => void; active?: boolean; disabled?: boolean;
    children: React.ReactNode; title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-muted transition-colors',
        active && 'bg-muted text-primary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 flex-wrap">

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Vet">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursief">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Onderstreept">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Kop 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Kop 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Ongeordende lijst">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Geordende lijst">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => { setShowLinkInput(v => !v); setLinkUrl(editor.getAttributes('link').href || ''); }} active={editor.isActive('link')} title="Link">
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={() => document.getElementById('tiptap-img-upload')?.click()} disabled={isUploading} title="Afbeelding">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <input
          id="tiptap-img-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
        />
      </div>

      {/* Link input bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSetLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" variant="secondary" onClick={handleSetLink} className="h-8 px-3">OK</Button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none" />
    </div>
  );
}
