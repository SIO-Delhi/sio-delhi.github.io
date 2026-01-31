import { Copy, Sliders } from 'lucide-react'

export interface ToolConfig {
    id: string
    label: string
    path: string
    icon: any // Lucide icon component
    activeMatch?: string // Path segment to match for active state
    description?: string
}

export const TOOLS: ToolConfig[] = [
    {
        id: 'frame-tool',
        label: 'Frame Tool',
        path: '/utilities/frame-tool',
        icon: Copy,
        activeMatch: 'frame-tool',
        description: 'Add custom frames and overlays to your photos'
    },
    {
        id: 'filter-tool',
        label: 'Filter Tool',
        path: '/utilities/filter-tool',
        icon: Sliders,
        activeMatch: 'filter-tool',
        description: 'Batch image editing with LUT support'
    },
]
