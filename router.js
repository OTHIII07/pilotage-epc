import { useEffect, useState } from 'react'

const read = () => (window.location.hash.replace(/^#\/?/, '') || 'accueil').split('?')[0]

export function useRoute() {
  const [path, setPath] = useState(read())
  useEffect(() => {
    const f = () => {
      setPath(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return path
}

export const go = (p) => {
  window.location.hash = '/' + p
}
