// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './helper/protected';
import './index.css';
import ProfileSelectionPage from './pages/ProfileSelectionPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OmniSearchPage from './pages/OmniSearchPage';
import DataControlPage from './pages/DataControlPage';
import MemoryArchivesPage from './pages/MemoryArchivesPage';
import SystemConfigPage from './pages/SystemConfigPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/SignupPage';

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        z-index={9999}
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />


        {/* protected routes */}
          <Route path="/profiles" element={<ProtectedRoute><ProfileSelectionPage /></ProtectedRoute>} />
          <Route path="/dashboard/data-control" element={<ProtectedRoute><DataControlPage /></ProtectedRoute>} />
          <Route path="/dashboard/omni-search" element={<ProtectedRoute><OmniSearchPage /></ProtectedRoute>} />
          {/* <Route path="/dashboard/memory-archives" element={<ProtectedRoute><MemoryArchivesPage /></ProtectedRoute>} /> */}
          <Route path="/dashboard/neural-links" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
          <Route path="/dashboard/system-config" element={<ProtectedRoute><SystemConfigPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
