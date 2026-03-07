import { createSupabaseAdmin } from './supabase'

const GEMINI_MODEL = 'gemini-3.1-flash-image-preview'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function generateImageFromPrompt(prompt, referenceImageBase64 = null) {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing')
  }

  const parts = [{ text: prompt }]
  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: referenceImageBase64
      }
    })
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  }

  const geminiRes = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  )

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`)
  }

  const geminiData = await geminiRes.json()
  const resParts = geminiData?.candidates?.[0]?.content?.parts ?? []
  const imgPart = resParts.find((p) => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imgPart) {
    const textPart = resParts.find((p) => typeof p.text === 'string')
    if (textPart) console.error(`Gemini said: ${textPart.text}`)
    throw new Error('No image returned by Gemini.')
  }

  return Buffer.from(imgPart.inlineData.data, 'base64')
}
