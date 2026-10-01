import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './settings-theme.css';

// Import หน้าต่างๆ
import Home from './pages/Home';
import Workshop from './pages/Workshop';
import Sheets from './pages/Sheets';
import CharacterSheetPage from './pages/CharacterSheetPage';
// ตรงนี้คือจุดสำคัญ: เรา Import ไฟล์ Compendium ตัวจริงมาใช้แล้ว
import CompendiumHub from './pages/CompendiumHub';
import Compendium from './pages/Compendium';
import AdminNavbar from './components/AdminNavbar';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ClassTest from './pages/ClassTest';
import ClassTestDM from './pages/ClassTestDM';
import ClassTestResult from './pages/ClassTestResult';
import Feedback from './pages/Feedback';
import LegalNotice from './pages/LegalNotice';
import ResetPassword from './pages/ResetPassword';
import HowToPlay from './pages/HowToPlay';
import Suspended from './pages/Suspended';
import { Dice3DProvider } from './components/dice3d/Dice3DProvider';
import Dice3DCanvas from './components/dice3d/Dice3DCanvas';

import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <Dice3DProvider>
      <Router>
        <Dice3DCanvas />
        <AppContent />
      </Router>
    </Dice3DProvider>
    </SettingsProvider>
  );
}


function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin-login';
  const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin-login';
  const isPlaySheetPage = location.pathname.startsWith('/character/');

  useEffect(() => {
    const checkUserStatus = async () => {
      const savedUser = localStorage.getItem('dnd_user');
      if (savedUser && !isAdminPage && location.pathname !== '/suspended') {
        try {
          const user = JSON.parse(savedUser);
          const res = await fetch('http://localhost:5000/api/auth/check_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.user_id })
          });
          const json = await res.json();
          if (json.status === 'suspended' || json.status === 'banned') {
            localStorage.removeItem('dnd_user');
            navigate('/suspended');
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    checkUserStatus();
  }, [location.pathname, navigate, isAdminPage]);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isLoginPage && !isAdminPage && <Navbar />}
      {isAdminPage && <AdminNavbar />}

      <main className="content-wrapper" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/suspended" element={<Suspended />} />
          
          {/* Compendium Routes */}
          <Route path="/compendium" element={<CompendiumHub />} />
          <Route path="/compendium/:category" element={<Compendium />} />
          
          <Route path="/sheets" element={<Sheets />} />
          <Route path="/character/:id" element={<CharacterSheetPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/class-test" element={<ClassTest />} />
          <Route path="/class-test-dm" element={<ClassTestDM />} />
          <Route path="/class-test-result" element={<ClassTestResult />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/legal" element={<LegalNotice />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          
          {/* เส้นทางลับสำหรับ DM */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      
      {!isLoginPage && !isAdminPage && <Footer />}
    </div>
  );
}

export default App;