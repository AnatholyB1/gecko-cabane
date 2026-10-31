import SpikeClient from './SpikeClient'
import './spike.css'

export default function Page() {
  return (
    <main className="adm-root p-8" data-testid="root">
      <h1 className="mb-6 text-2xl font-semibold">Spike Base UI</h1>
      <SpikeClient />
    </main>
  )
}
