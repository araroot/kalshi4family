import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const anthropic = new Anthropic()

function extractSvg(raw: string): string | null {
  // Strip markdown code fences
  let s = raw.replace(/^```(?:svg|xml)?\s*/i, '').replace(/\s*```$/, '').trim()
  // Strip XML declaration
  s = s.replace(/^<\?xml[^?]*\?>\s*/i, '').trim()
  // If it already starts with <svg we're good
  if (s.toLowerCase().startsWith('<svg')) return s
  // Otherwise try to pull out the svg element
  const match = s.match(/<svg[\s\S]*<\/svg>/i)
  return match ? match[0] : null
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in environment' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, marketId } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const prompt = `Create a cute, simple SVG icon (200×200) for a family prediction market about: "${title}"${description ? `\n\nContext: ${description.slice(0, 300)}` : ''}

Requirements:
- viewBox="0 0 200 200" width="200" height="200"
- Vibrant solid rounded-rect background filling the whole canvas
- One central emoji-style symbol related to the topic
- No text, no labels, 2-4 shapes max
- Fun cartoon style, readable at 40px

Output ONLY the raw SVG. No markdown fences, no XML declaration, no explanation. Begin your response with <svg`

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Claude API error: ${msg}` }, { status: 500 })
  }

  const rawText = (message.content[0] as { type: string; text: string }).text
  const svgContent = extractSvg(rawText)

  if (!svgContent) {
    return NextResponse.json({ error: 'Claude returned invalid SVG — try again' }, { status: 500 })
  }

  const svgBytes = Buffer.from(svgContent, 'utf-8')
  const imageId = marketId ?? randomUUID()
  const storagePath = `${imageId}.svg`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('market-images')
    .upload(storagePath, svgBytes, { contentType: 'image/svg+xml', upsert: true })

  if (uploadError) return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('market-images').getPublicUrl(storagePath)
  // Append timestamp so regenerated icons bypass browser/CDN cache
  const urlWithBust = `${publicUrl}?v=${Date.now()}`

  if (marketId) {
    await admin.from('markets').update({ image_url: urlWithBust }).eq('id', marketId)
  }

  return NextResponse.json({ url: urlWithBust })
}
