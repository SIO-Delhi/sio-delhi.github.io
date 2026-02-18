import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function ShortLinkRedirect() {
    const { shortCode } = useParams<{ shortCode: string }>()
    const navigate = useNavigate()
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!shortCode) return

        async function resolve() {
            try {
                const res = await api.shortLinks.resolve(shortCode!)
                if (res.data?.fullUrl) {
                    try {
                        const url = new URL(res.data.fullUrl)
                        // If same origin, use SPA navigation
                        if (url.origin === window.location.origin) {
                            navigate(url.pathname + url.search + url.hash, { replace: true })
                        } else {
                            window.location.replace(res.data.fullUrl)
                        }
                    } catch {
                        // If URL parsing fails, treat as relative path
                        window.location.replace(res.data.fullUrl)
                    }
                } else {
                    setError(true)
                }
            } catch {
                setError(true)
            }
        }
        resolve()
    }, [shortCode, navigate])

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                color: 'white',
                background: '#09090b',
                fontFamily: '"DM Sans", sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Link Not Found</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
                        This short link does not exist or has expired.
                    </p>
                    <a
                        href="/"
                        style={{
                            color: '#ff3b3b',
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#09090b'
        }}>
            <div className="portal-spinner" />
        </div>
    )
}
