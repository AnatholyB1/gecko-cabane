import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { normalizePhone, isE164Phone } from '@/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawPhone: string = (body.phone ?? '').trim()

    if (!rawPhone) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    }

    const phone = normalizePhone(rawPhone)

    if (!isE164Phone(phone)) {
      return NextResponse.json(
        { error: 'Format invalide. Exemple : +66812345678 ou 0812345678' },
        { status: 400 }
      )
    }

    // Twilio Verify handles OTP generation, SMS sending, rate-limiting and expiry
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({ to: phone, channel: 'sms' })

    return NextResponse.json({ success: true, phone })
  } catch (err: unknown) {
    console.error('[verify/send]', err)
    // Twilio error 21608: trial accounts can only send to verified numbers
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 21608) {
      return NextResponse.json(
        { error: 'Numéro non vérifié. En mode test Twilio, seuls les numéros vérifiés dans la console Twilio peuvent recevoir des SMS.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du SMS' }, { status: 500 })
  }
}
