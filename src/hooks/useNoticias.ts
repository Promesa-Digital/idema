import { useState, useEffect } from 'react'
import { noticias as staticNoticias } from '../data/noticias'
import type { Noticia } from '../types'

const PROXY_URL = import.meta.env.DEV
  ? '/api/noticias'
  : 'https://idema.edu.pe/php/noticias_proxy.php'

interface ProxyNoticia {
  title: string
  excerpt: string
  image: string
  date: string
  url: string
}

function proxyToNoticia(item: ProxyNoticia, index: number): Noticia {
  return {
    slug: `noticia-${index}`,
    title: item.title,
    summary: item.excerpt,
    image: item.image,
    date: item.date,
    externalUrl: item.url,
  }
}

export function useNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>(staticNoticias)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetch(PROXY_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed')
        return res.json()
      })
      .then((data: ProxyNoticia[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setNoticias(data.map(proxyToNoticia))
        }
      })
      .catch(() => {
        // Fallback to static data (already set as default)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  return { noticias, loading }
}
