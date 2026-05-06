import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, marketId } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const prompt = `Create a cute, simple SVG icon (200×200) for a family prediction market about: "${title}"${description ? `\n\nContext: ${description.slice(0, 300)}` : ''}

Requirements:
- Exactly 200×200 viewBox
- Single bold illustration: one central emoji-style symbol or character
- Vibrant solid background (rounded rect or circle, full size)
- No text, no labels, no borders
- 2-4 simple shapes max — readable at 40px
- Fun, friendly, cartoon style
- Colors should relate to the topic

Output ONLY the raw SVG code. No markdown, no explanation, no \`\`\`svg fences. Start with <svg and end with </svg>.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const svgContent = (message.content[0] as { type: string; text: string }).text.trim()

  if (!svgContent.startsWith('<svg')) {
    return NextResponse.json({ error: 'Invalid SVG generated' }, { status: 500 })
  }

  const svgBytes = Buffer.from(svgContent, 'utf-8')
  const imageId = marketId ?? randomUUID()
  const storagePath = `${imageId}.svg`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('market-images')
    .upload(storagePath, svgBytes, { contentType: 'image/svg+xml', upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('market-images').getPublicUrl(storagePath)

  if (marketId) {
    await admin.from('markets').update({ image_url: publicUrl }).eq('id', marketId)
  }

  return NextResponse.json({ url: publicUrl })
}
