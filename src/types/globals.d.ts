interface LenisInstance {
    scrollTo(target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean }): void
    destroy(): void
}

interface InstagramEmbeds {
    Embeds?: {
        process(): void
    }
}

interface FacebookSDK {
    XFBML?: {
        parse(element?: HTMLElement): void
    }
}

interface ResponsiveVoiceOptions {
    onend?: () => void
    onerror?: () => void
    pitch?: number
    rate?: number
    volume?: number
}

interface ResponsiveVoice {
    speak(text: string, voice?: string, options?: ResponsiveVoiceOptions): void
    cancel(): void
    isPlaying(): boolean
}

interface Window {
    lenis?: LenisInstance
    instgrm?: InstagramEmbeds
    FB?: FacebookSDK
    responsiveVoice?: ResponsiveVoice
}
