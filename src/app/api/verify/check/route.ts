import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import twilio from 'twilio'
import { createAdminClient } from '@/utils/supabase/server'
import { isOtpCode } from '@/utils/validation'

// Token valid for 30 minutes after successful verification
const TOKEN_TTL_MS = 30 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const phone: string = (body.phone ?? '').trim()
    const code: string = (body.code ?? '').trim()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Téléphone et code requis' }, { status: 400 })
    }

    if (!isOtpCode(code)) {
      return NextResponse.json({ error: 'Le code doit contenir 6 chiffres' }, { status: 400 })
    }

    // Delegate OTP check to Twilio Verify
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({ to: phone, code })

    if (check.status !== 'approved') {
      return NextResponse.json(
        { error: 'Code incorrect ou expiré. Veuillez réessayer.' },
        { status: 400 }
      )
    }

    // Generate a single-use token to prove this phone was verified
    const verifiedToken = randomUUID()
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()

    const supabase = createAdminClient()
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({ phone, verified_token: verifiedToken, token_expires_at: tokenExpiresAt })

    if (insertError) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true, token: verifiedToken })
  } catch (err) {
    console.error('[verify/check]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
