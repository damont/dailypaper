import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { Edition } from '../../types'
import Masthead from './Masthead'
import PageNav from './PageNav'
import NewspaperPage from './NewspaperPage'
import EmptyEdition from './EmptyEdition'

interface EditionViewProps {
  date?: string
  navigate: (path: string) => void
}

function todayStr(): string {
  const d = new Date()
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export default function EditionView({ date, navigate }: EditionViewProps) {
  const { user } = useAuth()
  const currentDate = date || todayStr()
  const isToday = currentDate === todayStr()

  const [edition, setEdition] = useState<Edition | null>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Edition>(`/api/editions/?date=${currentDate}`)
      .then(ed => {
        setEdition(ed)
        if (ed.pages.length > 0) {
          setActiveSlug(ed.pages[0].page_slug)
        } else {
          setActiveSlug(null)
        }
      })
      .catch(() => setEdition(null))
      .finally(() => setLoading(false))
  }, [currentDate])

  const activePage = edition?.pages.find(p => p.page_slug === activeSlug) ?? null

  return (
    <div>
      <Masthead
        newspaperName={user?.newspaper_name || 'The Daily Paper'}
        date={currentDate}
        onPrevDay={() => navigate(`/edition/${shiftDate(currentDate, -1)}`)}
        onNextDay={() => navigate(`/edition/${shiftDate(currentDate, 1)}`)}
        onToday={() => navigate('/edition')}
        isToday={isToday}
      />

      {loading ? (
        <p className="text-center py-8 text-[var(--text-muted)] italic">Loading edition...</p>
      ) : !edition || edition.pages.length === 0 ? (
        <EmptyEdition />
      ) : (
        <>
          <PageNav
            pages={edition.pages}
            activeSlug={activeSlug}
            onSelect={setActiveSlug}
          />
          {activePage && <NewspaperPage page={activePage} />}
        </>
      )}
    </div>
  )
}
