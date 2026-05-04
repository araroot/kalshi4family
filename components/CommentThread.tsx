'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, CornerDownRight, Send } from 'lucide-react'
import type { Comment, Profile } from '@/types'

interface CommentThreadProps {
  marketId: string
  comments: Comment[]
  currentUser: Profile
}

export default function CommentThread({ marketId, comments, currentUser }: CommentThreadProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)

  const topLevel = comments.filter(c => !c.parent_id)
  const replies: Record<string, Comment[]> = {}
  comments.filter(c => c.parent_id).forEach(c => {
    if (!replies[c.parent_id!]) replies[c.parent_id!] = []
    replies[c.parent_id!].push(c)
  })

  async function postComment(content: string, parentId: string | null = null) {
    if (!content.trim()) return
    setLoading(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: marketId, content: content.trim(), parent_id: parentId }),
    })
    setText('')
    setReplyText('')
    setReplyTo(null)
    router.refresh()
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[#a1a1aa]" />
        <h3 className="text-sm font-semibold text-white">Discussion</h3>
        <span className="text-xs text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">{comments.length}</span>
      </div>

      {/* Main input */}
      <div className="flex gap-2 mb-5">
        <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your thoughts… (English, Marathi, Japanese — all welcome!)"
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(text) }}
            className="w-full rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-[#555]">⌘↵ to send</span>
            <button
              onClick={() => postComment(text)}
              disabled={loading || !text.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-xs font-medium disabled:opacity-40 transition-colors"
            >
              <Send className="w-3 h-3" />
              Post
            </button>
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
              <CommentItem
                comment={comment}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              />

              {/* Replies */}
              {replies[comment.id]?.length > 0 && (
                <div className="ml-9 mt-2 space-y-2 border-l border-[#1a1a1a] pl-4">
                  {replies[comment.id].map(reply => (
                    <CommentItem key={reply.id} comment={reply} onReply={() => {}} isReply />
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyTo === comment.id && (
                <div className="ml-9 mt-2 pl-4 border-l border-[#2a2a2a]">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.user?.name ?? 'comment'}…`}
                      rows={1}
                      autoFocus
                      className="flex-1 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors resize-none"
                    />
                    <button
                      onClick={() => postComment(replyText, comment.id)}
                      disabled={loading || !replyText.trim()}
                      className="px-3 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-xs font-medium disabled:opacity-40 transition-colors self-end py-2"
                    >
                      <Send className="w-3 h-3" />
                    </button>
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
  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#a1a1aa] shrink-0 mt-0.5">
        {(comment.user?.name ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white">{comment.user?.name ?? 'Unknown'}</span>
          <span className="text-xs text-[#555]">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
        {!isReply && (
          <button
            onClick={onReply}
            className="flex items-center gap-1 mt-1 text-xs text-[#555] hover:text-[#a1a1aa] transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  )
}
