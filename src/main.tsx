import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from '@dr.pogodin/react-helmet'
import './index.css'
import App from './App.tsx'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { setAuthTokenProvider } from './lib/api'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  const hint = import.meta.env.DEV
    ? "Restart the dev server (npm run dev) so Vite reloads .env."
    : "Rebuild with .env present (npm run build). Deployed app? Set VITE_CLERK_PUBLISHABLE_KEY in the host's env and redeploy."
  throw new Error(`Missing Clerk Publishable Key. ${hint}`)
}

// Bridges Clerk's auth token to the api.ts module so all API calls
// automatically include the Authorization header when signed in.
function AuthTokenSync() {
  const { getToken } = useAuth()

  useEffect(() => {
    setAuthTokenProvider(() => getToken())
  }, [getToken])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
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
      <AuthTokenSync />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
    </HelmetProvider>
  </StrictMode>,
)

// Global unhandled error/rejection handlers — log to console in dev,
// prevent silent swallowed errors in production.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
  })

  window.addEventListener('error', (event) => {
    console.error('[Unhandled Error]', event.error ?? event.message)
  })
}

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

// Auto-detect Urdu/Arabic text nodes and apply `font-urdu` + `lang="ur"` granularly
// function applyUrduClass() {
//   try {
//     const textRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
//
//     // Containers to scan
//     const allowedContainers = ['.post-content', '.section-card-shine', '.subsection-grid', '.subsection', '.leader-bio', '.news-content']
//
//     allowedContainers.forEach(sel => {
//       document.querySelectorAll(sel).forEach(container => {
//         // Walk through all element nodes to find block-level text containers
//         const deepWalker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
//           acceptNode(node) {
//             const el = node as Element;
//             // Skip non-visible or irrelevant tags
//             if (['script', 'style', 'noscript', 'iframe', 'svg'].includes(el.tagName.toLowerCase())) {
//               return NodeFilter.FILTER_REJECT;
//             }
//             // We want to check elements that *directly* contain text or are block containers
//             // Common block tags: p, div, h1-h6, li, blockquote
//             if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div', 'span', 'strong', 'em'].includes(el.tagName.toLowerCase())) {
//               return NodeFilter.FILTER_ACCEPT;
//             }
//             return NodeFilter.FILTER_SKIP;
//           }
//         });
//
//         let currentNode = deepWalker.nextNode() as Element | null;
//         while (currentNode) {
//           // Check direct text content of this node (avoiding huge concatenated strings of children)
//           // We iterate childNodes to check for text
//           let hasUrdu = false;
//           for (let i = 0; i < currentNode.childNodes.length; i++) {
//             const child = currentNode.childNodes[i];
//             if (child.nodeType === Node.TEXT_NODE && child.textContent && textRegex.test(child.textContent)) {
//               hasUrdu = true;
//               break;
//             }
//           }
//
//           if (hasUrdu) {
//             currentNode.classList.add('font-urdu');
//             currentNode.setAttribute('lang', 'ur');
//             // currentNode.setAttribute('dir', 'rtl'); // User asked to remove auto-RTL
//
//             // If it's an inline element (span, strong, em), we might need to enforce the parent block to be RTL too for proper flow
//             // but let's stick to the element itself first.
//             // Actually, for alignment, the BLOCK element needs dir="rtl".
//             const style = window.getComputedStyle(currentNode);
//             if (style.display === 'inline') {
//               const parent = currentNode.parentElement;
//               if (parent) {
//                 parent.classList.add('font-urdu');
//                 parent.setAttribute('lang', 'ur');
//                 // parent.setAttribute('dir', 'rtl');
//               }
//             }
//           }
//
//           currentNode = deepWalker.nextNode() as Element | null;
//         }
//       })
//     })
//   } catch (e) {
//     // ignore
//   }
// }

if (typeof window !== 'undefined') {
  // window.addEventListener('load', () => applyUrduClass())

  // Observe dynamic content but keep actions scoped: re-run detector when nodes are added
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        // applyUrduClass()
        break
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
