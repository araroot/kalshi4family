import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const prompt = `You are helping create a family prediction market — a fun, friendly yes/no question where people bet points on the outcome.

Market question: "${title}"

Current description (may be empty or rough):
${description?.trim() || '(none provided)'}

Rewrite or create a clear, well-structured description for this market. Your output should:
1. State the resolution criteria precisely — exactly what needs to happen for YES to win vs NO
2. Call out any edge cases or ambiguous scenarios and how they'd be resolved
3. Mention the source of truth (e.g. "official announcement", "match result", "family vote")
4. Use markdown formatting: **bold** for key terms, bullet lists for rules, ## headings if it's complex
5. Be concise but complete — thorough enough that no one can argue about the outcome
6. Keep the tone friendly and fun (this is for family/friends)

Output ONLY the refined description text. No preamble, no "Here is your description:", just the markdown content itself.`

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
