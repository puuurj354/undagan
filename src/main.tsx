import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AdminPage from './pages/AdminPage.tsx'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('[main] Root element #root not found in the DOM.')
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Halaman undangan utama */}
        <Route path="/" element={<App />} />
        {/* Panel admin CRM */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
