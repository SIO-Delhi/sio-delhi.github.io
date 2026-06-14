import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PerfFieldType } from '../types'
import { PerfFormBuilderPage } from '../pages/PerfFormBuilderPage'
import * as api from '../api'

vi.mock('../context/PortalAuthContext', () => ({
  usePortalAuth: () => ({
    user: {
      id: 'admin-1',
      role: 'admin',
      full_name: 'Admin User',
    },
  }),
}))

vi.mock('../api', () => ({
  fetchUnits: vi.fn(),
  fetchRegions: vi.fn(),
  fetchCircles: vi.fn(),
  fetchCampuses: vi.fn(),
  fetchPerfForms: vi.fn(),
  fetchPerfForm: vi.fn(),
}))

describe('PerfFormBuilderPage presets', () => {
  beforeEach(() => {
    vi.mocked(api.fetchUnits).mockResolvedValue([])
    vi.mocked(api.fetchRegions).mockResolvedValue([])
    vi.mocked(api.fetchCircles).mockResolvedValue([])
    vi.mocked(api.fetchCampuses).mockResolvedValue([])
    vi.mocked(api.fetchPerfForms).mockResolvedValue([
      {
        id: 'template-1',
        title: 'Saved Outreach Preset',
        description: 'A saved form template',
        created_by: 'user-1',
        scope_unit_id: null,
        period: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        is_template: 1,
        is_active: 1,
        fields: [
          {
            id: 'field-1',
            form_id: 'template-1',
            type: 'short_text' as PerfFieldType,
            label: 'Saved Question',
            description: '',
            options: [],
            is_required: 1,
            display_order: 1,
            max_value: null,
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    ] as Awaited<ReturnType<typeof api.fetchPerfForms>>)
    vi.mocked(api.fetchPerfForm).mockResolvedValue({
      id: 'template-1',
      title: 'Saved Outreach Preset',
      description: 'A saved form template',
      created_by: 'admin-1',
      scope_unit_id: null,
      period: null,
      is_active: 1,
      is_template: 1,
      is_public: 0,
      fields: [
        {
          id: 'field-1',
          form_id: 'template-1',
          type: 'short_text',
          label: 'Saved Question',
          description: '',
          options: [],
          is_required: 1,
          display_order: 1,
          max_value: null,
          created_at: '2026-06-13 00:00:00',
        },
      ],
      created_at: '2026-06-13 00:00:00',
      updated_at: '2026-06-13 00:00:00',
    })
  })

  it('shows saved template forms in the preset picker', async () => {
    render(
      <MemoryRouter>
        <PerfFormBuilderPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(api.fetchPerfForms).toHaveBeenCalled())

    expect(screen.getByRole('button', { name: /saved outreach preset/i })).toBeInTheDocument()
  })

  it('loads a saved preset into the builder when selected', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PerfFormBuilderPage />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /saved outreach preset/i }))

    expect(await screen.findByDisplayValue('Saved Outreach Preset')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Saved Question')).toBeInTheDocument()
  })
})
