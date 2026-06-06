import { IconShieldCheck, IconCheck } from '@tabler/icons-react'

const GUARANTEES = [
  'Wir fragen weder Name noch E-Mail — du musst dich nicht anmelden.',
  'Ein gemeinsamer Link für alle Mitarbeitenden — keine Zuordnung zu einer Person möglich.',
  'Freitext wird vor der Auswertung durch KI anonymisiert.',
  'Ergebnisse sind erst ab mehreren Antworten je Abteilung sichtbar.',
  'Keine IP-Adresse, kein Gerät und keine genaue Uhrzeit werden gespeichert.',
  'HR sieht ausschließlich aggregierte Auswertungen — niemals einzelne Antworten.',
]

export function AnonymityPanel() {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 font-medium text-primary">
        <IconShieldCheck className="size-5" />
        Vollständig anonym — und so stellen wir das sicher
      </div>

      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {GUARANTEES.map((g) => (
          <li key={g} className="flex items-start gap-2">
            <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{g}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
