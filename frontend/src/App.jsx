import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { fetchProfile } from './features/auth/authThunks';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // On initial load or refresh, only restore session if we have a stored token
    try {
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('authToken');
        if (token) {
          dispatch(fetchProfile());
        }
      }
    } catch (e) {
      // If storage is unavailable, skip auto-login
    }
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;