import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Diagnostics & Health Check */}
              <Route path="/diagnostics" element={<Diagnostics />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-800/80 bg-[#070b12] py-5 text-center text-xs text-slate-500">
            <p>PatchWatch &copy; 2026 &mdash; Software Engineering Dependency Security Platform.</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
