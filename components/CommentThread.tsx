'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, CornerDownRight, Send, Paperclip, X, ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Comment, Profile } from '@/types'

const BUCKET = 'comment-attachments'
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

interface CommentThreadProps {
  marketId: string
  comments: Comment[]
  currentUser: Profile
}

export default function CommentThread({ marketId, comments, currentUser }: CommentThreadProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const [replyPreview, setReplyPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const replyFileRef = useRef<HTMLInputElement>(null)

  const topLevel = comments.filter(c => !c.parent_id)
  const repliesMap: Record<string, Comment[]> = {}
  comments.filter(c => c.parent_id).forEach(c => {
    repliesMap[c.parent_id!] ??= []
    repliesMap[c.parent_id!].push(c)
  })

  function pickFile(f: File | null | undefined, isReply = false) {
    if (!f) return
    if (!ALLOWED.includes(f.type)) { alert('Only images are supported (JPG, PNG, GIF, WebP)'); return }
    if (f.size > MAX_SIZE) { alert('Max file size is 8 MB'); return }
    const url = URL.createObjectURL(f)
    if (isReply) { setReplyFile(f); setReplyPreview(url) }
    else { setFile(f); setPreview(url) }
  }

  function clearFile(isReply = false) {
    if (isReply) { setReplyFile(null); setReplyPreview(null) }
    else { setFile(null); setPreview(null) }
  }

  async function uploadFile(f: File): Promise<string | null> {
    const supabase = createClient()
    const ext = f.name.split('.').pop() ?? 'jpg'
    const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { cacheControl: '31536000' })
    if (error) { console.error('Upload error:', error); return null }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return publicUrl
  }

  async function postComment(content: string, parentId: string | null, attachFile: File | null) {
    if (!content.trim() && !attachFile) return
    setLoading(true)

    let attachment_url: string | null = null
    if (attachFile) attachment_url = await uploadFile(attachFile)

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: marketId, content: content.trim(), parent_id: parentId, attachment_url }),
    })

    setText(''); setFile(null); setPreview(null)
    setReplyText(''); setReplyFile(null); setReplyPreview(null)
    setReplyTo(null)
    router.refresh()
    setLoading(false)
  }

  // Paste handler for images
  function handlePaste(e: React.ClipboardEvent, isReply = false) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) { e.preventDefault(); pickFile(item.getAsFile(), isReply) }
  }

  // Drag-and-drop on the main composer
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[#a1a1aa]" />
        <h3 className="text-sm font-semibold text-white">Discussion</h3>
        <span className="text-xs text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">{comments.length}</span>
      </div>

      {/* Main composer */}
      <div className="flex gap-2 mb-5">
        <Avatar name={currentUser.name} />
        <div className="flex-1">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border transition-colors ${dragging ? 'border-[#6366f1] bg-[#1e1b4b]/20' : 'border-[#2a2a2a] bg-[#1a1a1a]'}`}
          >
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onPaste={e => handlePaste(e, false)}
              placeholder="Share your thoughts… paste or drop an image too! 🖼️"
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(text, null, file) }}
              className="w-full bg-transparent text-white px-3 pt-2.5 pb-1 text-sm placeholder:text-[#555] focus:outline-none resize-none"
            />

            {/* Image preview */}
            {preview && (
              <div className="relative mx-3 mb-2 w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="attachment" className="max-h-40 max-w-xs rounded-lg object-cover border border-[#333]" />
                <button
                  onClick={() => clearFile(false)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#dc2626] rounded-full flex items-center justify-center hover:bg-[#b91c1c] transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {/* Composer toolbar */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#222]">
              <div className="flex items-center gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  title="Attach image"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[#555] hover:text-[#a1a1aa] hover:bg-[#222] transition-colors text-xs"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Attach</span>
                </button>
                <span className="text-[#444] text-xs hidden sm:inline">· paste or drop image</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#555]">⌘↵</span>
                <button
                  onClick={() => postComment(text, null, file)}
                  disabled={loading || (!text.trim() && !file)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      {topLevel.length === 0 ? (
        <p className="text-sm text-[#555] text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map(comment => (
            <div key={comment.id} className="animate-fade-in">
              <CommentItem comment={comment} onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)} />

              {repliesMap[comment.id]?.length > 0 && (
                <div className="ml-9 mt-2 space-y-2 border-l border-[#1a1a1a] pl-4">
                  {repliesMap[comment.id].map(reply => (
                    <CommentItem key={reply.id} comment={reply} onReply={() => {}} isReply />
                  ))}
                </div>
              )}

              {replyTo === comment.id && (
                <div className="ml-9 mt-2 pl-4 border-l border-[#2a2a2a]">
                  <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onPaste={e => handlePaste(e, true)}
                      placeholder={`Reply to ${comment.user?.name ?? 'comment'}… paste image to attach`}
                      rows={1}
                      autoFocus
                      className="w-full bg-transparent text-white px-3 pt-2 pb-1 text-sm placeholder:text-[#555] focus:outline-none resize-none"
                    />
                    {replyPreview && (
                      <div className="relative mx-3 mb-2 w-fit">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={replyPreview} alt="attachment" className="max-h-32 max-w-[200px] rounded-lg object-cover border border-[#333]" />
                        <button onClick={() => clearFile(true)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#dc2626] rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-[#222]">
                      <div className="flex items-center gap-1">
                        <input ref={replyFileRef} type="file" accept="image/*" className="hidden" onChange={e => pickFile(e.target.files?.[0], true)} />
                        <button type="button" onClick={() => replyFileRef.current?.click()} className="text-[#555] hover:text-[#a1a1aa] transition-colors p-1 rounded">
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setReplyTo(null); clearFile(true) }} className="px-2 py-1 rounded-lg bg-[#222] text-[#a1a1aa] text-xs hover:text-white transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={() => postComment(replyText, comment.id, replyFile)}
                          disabled={loading || (!replyText.trim() && !replyFile)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-xs font-medium disabled:opacity-40 transition-colors"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment, onReply, isReply = false }: { comment: Comment; onReply: () => void; isReply?: boolean }) {
  const [imgOpen, setImgOpen] = useState(false)

  return (
    <div className="flex gap-2.5">
      <Avatar name={comment.user?.name ?? '?'} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white">{comment.user?.name ?? 'Unknown'}</span>
          <span className="text-xs text-[#555]">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </div>

        {comment.content && (
          <p className="text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
        )}

        {comment.attachment_url && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.attachment_url}
              alt="attachment"
              onClick={() => setImgOpen(true)}
              className="max-h-48 max-w-xs rounded-xl object-cover border border-[#2a2a2a] cursor-zoom-in hover:border-[#333] transition-colors"
            />
          </div>
        )}

        {!isReply && (
          <button onClick={onReply} className="flex items-center gap-1 mt-1 text-xs text-[#555] hover:text-[#a1a1aa] transition-colors">
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        )}
      </div>

      {/* Lightbox */}
      {imgOpen && comment.attachment_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setImgOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={comment.attachment_url}
            alt="full size"
            className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setImgOpen(false)} className="absolute top-4 right-4 w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#a1a1aa] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs'
  return (
    <div className={`${s} rounded-full bg-[#6366f1] flex items-center justify-center font-bold text-white shrink-0 mt-0.5`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
