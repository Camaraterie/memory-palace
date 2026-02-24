import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

// GET /q/<short_id>/qr
// Returns the QR code PNG for a memory capsule directly as image/png.
// No auth required — the QR just encodes the public capsule URL.
// Designed for agents that need the QR as a file, not as base64 in JSON.

export async function GET(request, context) {
    try {
        const params = await context.params
        const shortId = params.id

        if (!shortId || !/^[a-z0-9]+$/i.test(shortId)) {
            return new NextResponse('Invalid short_id', { status: 400 })
        }

        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const host = request.headers.get('host') || 'm.cuer.ai'
        const capsuleUrl = `${protocol}://${host}/q/${shortId}`

        const qrBuffer = await QRCode.toBuffer(capsuleUrl, {
            errorCorrectionLevel: 'H',
            margin: 4,
            width: 512,
            color: { dark: '#000000', light: '#ffffff' },
        })

        return new NextResponse(qrBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `inline; filename="qr-${shortId}.png"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        console.error('QR route error:', error)
        return new NextResponse('Failed to generate QR code', { status: 500 })
    }
}
