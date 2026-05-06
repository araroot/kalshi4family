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
  // Try to pull out a complete <svg>...</svg> element
  const match = s.match(/<svg[\s\S]*?<\/svg>/i)
  if (match) return match[0]
  // If it starts with <svg but has no closing tag, it's truncated — reject
  return null
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

  const prompt = `Create an expressive, detailed SVG icon (200×200) for a prediction market about: "${title}"${description ? `\n\nContext: ${description.slice(0, 200)}` : ''}

Design rules:
- viewBox="0 0 200 200" width="200" height="200"
- Background: a soft radial or linear gradient (two complementary colors) — NOT a flat solid fill
- Central illustration: a recognizable emoji-style drawing of the subject, filling ~65% of the canvas, centered
- Use 6-10 shapes with details: body, highlights, shadows, small accent elements
- Bold outlines (stroke-width="3" or "4") on main shapes so it reads clearly at 40px
- Bright saturated colors with strong contrast against the background
- Add a subtle drop shadow or glow on the main element (use <filter> or offset duplicate)
- Absolutely no text or letters
- The viewer should instantly recognize the topic from the icon alone

Output ONLY raw SVG. No markdown, no XML declaration, no explanation. Start directly with <svg`

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
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
