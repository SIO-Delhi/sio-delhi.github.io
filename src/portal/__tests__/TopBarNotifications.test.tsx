import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TopBar } from '../components/TopBar'
import * as api from '../api'

const navigate = vi.fn()
const refresh = vi.fn()
const decrement = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../context/PortalAuthContext', () => ({
  usePortalAuth: () => ({
    user: {
      id: 'admin-1',
      role: 'admin',
      full_name: 'Admin User',
    },
  }),
}))

vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({
    counts: { unreadMessages: 0, pendingMigrations: 0, pendingForms: 1 },
    refresh,
    decrement,
  }),
}))

vi.mock('../api', () => ({
  markPerfResponseNotificationsSeen: vi.fn(),
  searchPortal: vi.fn(),
}))

describe('TopBar notifications', () => {
  beforeEach(() => {
    navigate.mockReset()
    refresh.mockReset()
    decrement.mockReset()
    vi.mocked(api.markPerfResponseNotificationsSeen).mockResolvedValue()
  })

  it('marks response review notifications read when opened from the bell', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await user.click(screen.getByRole('button', { name: /responses needing review/i }))

    expect(api.markPerfResponseNotificationsSeen).toHaveBeenCalledWith('admin-1')
    expect(decrement).toHaveBeenCalledWith('pendingForms', 1)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/portal/admin/forms'))
  })
})
