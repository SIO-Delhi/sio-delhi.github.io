export function PostSkeleton({ isDark }: { isDark: boolean }) {
    const shimmer = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `
    const skeletonStyle = {
        background: isDark
            ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '8px',
    }

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', opacity: 0.7 }}>
            <style>{shimmer}</style>

            {/* Hero Image Skeleton */}
            <div style={{
                width: '100%',
                height: '45vh',
                marginBottom: '40px',
                ...skeletonStyle
            }} />

            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Title Skeleton */}
                <div style={{
                    width: '60%',
                    height: '60px',
                    marginBottom: '16px',
                    ...skeletonStyle
                }} />

                {/* Subtitle/Meta Skeleton */}
                <div style={{
                    width: '40%',
                    height: '24px',
                    marginBottom: '40px',
                    ...skeletonStyle
                }} />

                {/* Content Block 1 */}
                <div style={{
                    width: '100%',
                    height: '200px',
                    marginBottom: '32px',
                    borderRadius: '16px',
                    ...skeletonStyle
                }} />

                {/* Content Block 2 */}
                <div style={{
                    width: '100%',
                    height: '300px',
                    marginBottom: '32px',
                    borderRadius: '16px',
                    ...skeletonStyle
                }} />
            </div>
        </div>
    )
}
