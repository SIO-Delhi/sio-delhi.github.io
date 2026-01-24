import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ContentProvider } from '../context/ContentContext'

interface AllProvidersProps {
    children: React.ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
    return (
        <BrowserRouter>
            <ContentProvider>
                {children}
            </ContentProvider>
        </BrowserRouter>
    )
}

function customRender(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
