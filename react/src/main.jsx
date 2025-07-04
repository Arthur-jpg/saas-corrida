import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/fix-scroll.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react';

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'SUA_CLERK_PUBLISHABLE_KEY'}>
    <StrictMode>
      <App />
    </StrictMode>
  </ClerkProvider>
)
