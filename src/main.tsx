import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      localization={{
        signIn: {
          start: {
            title: 'Sign in'
          }
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)

// Enable shiny animations after the full window load to avoid a bright
// initial animation frame (reduces the flash-of-brightness on buttons).
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    try {
      document.documentElement.classList.add('shiny-ready')
    } catch (e) {
      // ignore
    }
  })
}

// Auto-detect Urdu/Arabic text nodes and apply `font-urdu` + `lang="ur"` only
// inside known content containers (prevents global layout flip).
function applyUrduClass() {
  try {
    const textRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

    // Containers where Urdu should be applied
    const allowedContainers = ['.post-content', '.section-card-shine', '.subsection-grid', '.subsection']

    // Remove any previously-applied Urdu markers outside allowed containers
    document.querySelectorAll('[lang="ur"], .font-urdu').forEach((el) => {
      const inside = allowedContainers.some(sel => (el as Element).closest(sel))
      if (!inside) {
        el.classList.remove('font-urdu')
        el.removeAttribute('lang')
        el.removeAttribute('dir')
      }
    })

    // For each allowed container found, scan descendants and mark Urdu-containing nodes
    allowedContainers.forEach(sel => {
      document.querySelectorAll(sel).forEach(container => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
          acceptNode(node) {
            const el = node as Element
            const tag = el.tagName.toLowerCase()
            if (['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'input', 'textarea'].includes(tag)) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
          }
        })

        let node = walker.nextNode() as Element | null
        while (node) {
          const text = node.textContent
          if (text && textRegex.test(text)) {
            node.classList.add('font-urdu')
            node.setAttribute('lang', 'ur')
            node.setAttribute('dir', 'rtl')
          }
          node = walker.nextNode() as Element | null
        }
      })
    })
  } catch (e) {
    // don't break the app if detection fails
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => applyUrduClass())

  // Observe dynamic content but keep actions scoped: re-run detector when nodes are added
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        applyUrduClass()
        break
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
