import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { fetchProfile } from './features/auth/authThunks';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // On initial load or refresh, ask backend who is logged in (via cookie)
    dispatch(fetchProfile());
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;