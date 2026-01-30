import { Copy } from 'lucide-react'

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
    // Future tools can be added here
]
