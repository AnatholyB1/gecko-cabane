import { Check, LoaderCircle, Minus } from 'lucide-react'

/**
 * Interrupteur à libellé texte obligatoire (D3 §1) : `role="switch"`, piste 52 x 30, pouce avec
 * coche (actif) ou tiret (inactif), zone cliquable 44 px. L'état n'est jamais porté par la couleur
 * seule : le mot (« Disponible » / « Indisponible ») est toujours affiché.
 */
export function Switch({
  checked,
  onChange,
  label,
  onText,
  offText,
  busy,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  /** Nom accessible complet (« Disponibilité de Tom Kha Gai »). */
  label: string
  onText: string
  offText: string
  busy?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy ? true : undefined}
      className="mn-sw"
      onClick={() => {
        if (!busy) onChange(!checked)
      }}
    >
      <span className="mn-sw__track">
        <span className="mn-sw__thumb">
          {busy ? (
            <LoaderCircle className="i adm-spin" aria-hidden="true" focusable="false" />
          ) : checked ? (
            <Check className="i" aria-hidden="true" focusable="false" />
          ) : (
            <Minus className="i" aria-hidden="true" focusable="false" />
          )}
        </span>
      </span>
      <span className="mn-sw__text">{checked ? onText : offText}</span>
    </button>
  )
}
