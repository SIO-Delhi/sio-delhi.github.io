
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertCircle } from 'lucide-react'

import logo from '../assets/logo.png'

export function AdminLogin() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Hardcoded credentials check
        if (username === 'adnan' && password === 'adnan1234') {
            sessionStorage.setItem('sio_admin_auth', 'true')
            navigate('/admin/dashboard')
        } else {
            setError('Invalid username or password')
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            fontFamily: '"Geist", sans-serif',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '48px 40px',
                borderRadius: '24px',
                background: '#0a0a0a',
                border: '1px solid #222',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ margin: '0 auto 24px', width: '80px' }}>
                        <img src={logo} alt="SIO Logo" style={{ width: '100%', height: 'auto' }} />
                    </div>
                    <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Admin Login</h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Enter your credentials to access the dashboard.</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', borderRadius: '10px',
                        background: 'rgba(255, 59, 59, 0.1)',
                        border: '1px solid rgba(255, 59, 59, 0.2)',
                        marginBottom: '24px', color: '#ff6b6b', fontSize: '0.9rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Username */}
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            autoComplete="username"
                            style={{
                                width: '100%', padding: '16px 16px 16px 48px',
                                borderRadius: '12px', background: '#111',
                                border: '1px solid #333', color: 'white',
                                fontSize: '1rem', outline: 'none',
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            style={{
                                width: '100%', padding: '16px 16px 16px 48px',
                                borderRadius: '12px', background: '#111',
                                border: '1px solid #333', color: 'white',
                                fontSize: '1rem', outline: 'none',
                            }}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        style={{
                            width: '100%', padding: '16px',
                            borderRadius: '100px', background: '#ff3b3b',
                            border: 'none', color: 'white',
                            fontSize: '1rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e62e2e'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ff3b3b'}
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
