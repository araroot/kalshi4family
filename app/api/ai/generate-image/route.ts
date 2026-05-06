import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, marketId } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const togetherKey = process.env.TOGETHER_API_KEY
  if (!togetherKey) return NextResponse.json({ error: 'Image generation not configured (TOGETHER_API_KEY missing)' }, { status: 503 })

  const prompt = `cute cartoon icon illustration for a prediction market bet: "${title}". Simple bold design, vibrant solid color background, single centered symbol or character, flat vector art style, fun and friendly, no text, no words, square format`

  const togetherRes = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${togetherKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell-Free',
      prompt,
      width: 512,
      height: 512,
      steps: 1,
      n: 1,
      response_format: 'b64_json',
    }),
  })

  if (!togetherRes.ok) {
    const err = await togetherRes.text()
    return NextResponse.json({ error: `Image generation failed: ${err}` }, { status: 500 })
  }

  const togetherData = await togetherRes.json()
  const base64 = togetherData.data?.[0]?.b64_json
  if (!base64) return NextResponse.json({ error: 'No image returned' }, { status: 500 })

  const imageBytes = Buffer.from(base64, 'base64')
  const imageId = marketId ?? randomUUID()
  const storagePath = `${imageId}.png`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('market-images')
    .upload(storagePath, imageBytes, { contentType: 'image/png', upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('market-images').getPublicUrl(storagePath)

  if (marketId) {
    await admin.from('markets').update({ image_url: publicUrl }).eq('id', marketId)
  }

  return NextResponse.json({ url: publicUrl })
}
