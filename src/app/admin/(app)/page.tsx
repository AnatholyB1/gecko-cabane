import { Card, CardHeader } from '@/components/admin/Card'
import { PageHeader } from '@/components/admin/PageHeader'
import { HomeCards } from '@/components/admin/shell/HomeCards'
import { krabiDateLabel } from '@/components/admin/shell/krabi-date'

/**
 * Accueil de l'admin. Les cartes de navigation sont générées depuis nav.ts
 * (plus de liste écrite à la main : c'est elle qui avait gardé un lien mort).
 * Le contenu « Aujourd'hui » (arrivées, couverts, réservations à confirmer)
 * arrive en phase 15.
 */
export default function AdminPage() {
  return (
    <>
      <PageHeader title="Bonjour" description={`${krabiDateLabel(new Date())}. Où souhaitez-vous aller ?`} />
      <HomeCards />

      <Card className="adm-info">
        <CardHeader title="Informations du restaurant" />
        <dl className="adm-info__grid">
          <div>
            <dt className="adm-small adm-muted">Adresse</dt>
            <dd>1/36-37 Soi Ruamjit, Maharat Road</dd>
            <dd>Krabi Town 81000, Thaïlande</dd>
          </div>
          <div>
            <dt className="adm-small adm-muted">Téléphone</dt>
            <dd>+66 81 958 5945</dd>
          </div>
          <div>
            <dt className="adm-small adm-muted">Capacité</dt>
            <dd>40 places maximum</dd>
          </div>
          <div>
            <dt className="adm-small adm-muted">Horaires</dt>
            <dd>12h - 22h (ouvert tous les jours)</dd>
          </div>
        </dl>
      </Card>
    </>
  )
}
