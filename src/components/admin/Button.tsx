import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'
export type ButtonSize = 'md' | 'sm'

type ClassOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  iconOnly?: boolean
  block?: boolean
}

/** Classes d'un bouton, utilisables aussi sur un lien (`<a className={buttonClass(...)}>`). */
export function buttonClass({ variant = 'secondary', size = 'md', iconOnly, block }: ClassOptions = {}): string {
  return [
    'adm-btn',
    variant !== 'secondary' && `adm-btn--${variant}`,
    size === 'sm' && 'adm-btn--sm',
    iconOnly && 'adm-btn--icon',
    block && 'adm-btn--block',
  ]
    .filter(Boolean)
    .join(' ')
}

type BaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  /** Chargement : `aria-busy`, spinner, non cliquable, libellé conservé lisible. */
  loading?: boolean
  /** Libellé affiché pendant le chargement (ex. « Enregistrement… »). */
  loadingLabel?: string
}

type LabelledProps = BaseProps & { iconOnly?: false; children: ReactNode }
/** Un bouton icône exige un nom accessible (jamais `title` seul). */
type IconOnlyProps = BaseProps & { iconOnly: true; 'aria-label': string; children: ReactNode }

export type ButtonProps = LabelledProps | IconOnlyProps

export function Button(props: ButtonProps) {
  const { variant, size, block, loading, loadingLabel, iconOnly, className, onClick, children, type = 'button', 'aria-disabled': ariaDisabled, ...rest } = props
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }
  return (
    <button
      {...rest}
      type={type}
      className={[buttonClass({ variant, size, iconOnly, block }), className].filter(Boolean).join(' ')}
      aria-busy={loading ? true : undefined}
      aria-disabled={loading ? true : ariaDisabled}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <LoaderCircle className="i i-sm adm-spin" aria-hidden="true" focusable="false" />
          {iconOnly ? null : (loadingLabel ?? children)}
        </>
      ) : (
        children
      )}
    </button>
  )
}
