import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DailyReport from './pages/DailyReport';
import ThemeManagement from './pages/ThemeManagement';
import Report from './pages/Report';
import ChildData from './pages/ChildData';
import Login from './pages/Login';
import Login1 from './parent/Login1'; // ✅ Corrected path
import Login2 from './parent/Login2'; // ✅ Corrected path

import Childreport from './parent/Childreport';
import { auth } from './firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login1 />} />
        <Route path="/login2" element={<Login2 />} />
<Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />

        <Route path="/daily-report" element={user ? <DailyReport /> : <Navigate to="/login" />} />
        <Route path="/theme-management" element={user ? <ThemeManagement /> : <Navigate to="/login" />} />
        <Route path="/report" element={user ? <Report /> : <Navigate to="/login" />} />
        <Route path="/child-data" element={user ? <ChildData /> : <Navigate to="/login" />} />

        <Route path="/child-report" element={user ? <Childreport /> : <Navigate to="/login" />} />
      </Routes>

      {/* 🔐 reCAPTCHA container stays persistent across route changes */}
      <div id="recaptcha-container"></div>
    </Router>
  );
}

export default App;
