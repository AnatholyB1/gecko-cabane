import Script from 'next/script'
import { getPlausibleScriptId } from '@/utils/analytics'

// Inert (renders nothing) until a valid NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID exists (D-02).
const INIT =
  'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init({endpoint:"/gcm/api/event"})'

export default function PlausibleScript() {
  const id = getPlausibleScriptId()
  if (!id) return null
  return (
    <>
      <Script src="/gcm/js/script.js" strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {INIT}
      </Script>
    </>
  )
}
