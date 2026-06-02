import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AppRoutes from '@/routes';
import axiosInstance from '@/api/axiosInstance';

export default function App() {
  useEffect(() => {
    // Silent warm-up ping to wake up the Render backend container immediately
    axiosInstance.get('/health').catch(() => {
      // Fail silently (doesn't matter if it fails, just meant to ping)
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
