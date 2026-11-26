import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Products from '@/pages/Products'
import Dashboard from '@/pages/Dashboard'
import Stock from '@/pages/Stock'
import Sales from '@/pages/Sales'
import Warehouse from '@/pages/Warehouse'
import { getToken } from '@/lib/api'

function RequireLogin({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireLogin>
              <Dashboard />
            </RequireLogin>
          }
        />
        <Route
          path="/products"
          element={
            <RequireLogin>
              <Products />
            </RequireLogin>
          }
        />
        <Route
          path="/stock"
          element={
            <RequireLogin>
              <Stock />
            </RequireLogin>
          }
        />
        <Route
          path="/sales"
          element={
            <RequireLogin>
              <Sales />
            </RequireLogin>
          }
        />
        <Route
          path="/warehouse"
          element={
            <RequireLogin>
              <Warehouse />
            </RequireLogin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}