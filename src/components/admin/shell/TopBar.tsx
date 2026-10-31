import Link from 'next/link'
import { ADMIN_HOME_HREF, BRAND_ARIA, BRAND_NAME, NEW_RESERVATION_ARIA, NEW_RESERVATION_HREF, NEW_RESERVATION_LABEL } from '@/app/admin/(app)/nav'
import { NewReservationLink } from '../reservations/NewReservation'
import { AccountMenu } from './AccountMenu'
import { krabiDateLabel } from './krabi-date'

/**
 * En-tête global : logotype (téléphone), date de Krabi (tablette et plus),
 * « + Réservation » (présent sur toutes les pages du shell) et menu du compte.
 */
export function TopBar({
  email,
  logoutAction,
  now = new Date(),
}: {
  email: string
  logoutAction: () => void | Promise<void>
  now?: Date
}) {
  return (
    <header className="adm-header">
      <Link className="adm-wordmark adm-wordmark--header" href={ADMIN_HOME_HREF} prefetch={false} aria-label={BRAND_ARIA}>
        <span className="adm-wordmark__mark" aria-hidden="true">G</span>
        <span className="adm-wordmark__name">{BRAND_NAME}</span>
      </Link>
      <p className="adm-header__date adm-num">{krabiDateLabel(now)}</p>
      <div className="adm-header__right">
        <NewReservationLink href={NEW_RESERVATION_HREF} label={NEW_RESERVATION_LABEL} ariaLabel={NEW_RESERVATION_ARIA} />
        <AccountMenu email={email} logoutAction={logoutAction} />
      </div>
    </header>
  )
}
