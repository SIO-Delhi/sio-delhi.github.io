/**
 * FilterToolPage - Page wrapper for the Filter Tool
 */

import { ToolLayout } from '../components/tools/layout/ToolLayout'
import { FilterTool } from '../components/tools/filter/FilterTool'

export function FilterToolPage() {
    return (
        <ToolLayout>
            <FilterTool />
        </ToolLayout>
    )
}
