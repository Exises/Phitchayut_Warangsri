import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  
  // ตรวจสอบสถานะการล็อกอิน
  const user = JSON.parse(localStorage.getItem('dnd_user'));
  const isLoggedIn = !!user;

  const handleProtectedClick = (e, path) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowAccessDenied(true);
    }
  };

  // ฟังก์ชันช่วยเช็คว่า URL ปัจจุบันตรงกับลิงก์ไหน เพื่อใส่ class 'active'
  const isActive = (path) => location.pathname === path ? "menu-btn active" : "menu-btn";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="modal-overlay">
          <div className="modal-content-minimal animate-slide-down">
            <button className="modal-close-minimal" onClick={() => setShowAccessDenied(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="access-denied-container">
              <div className="denied-icon-wrapper">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h2 className="denied-title">สิทธิ์การเข้าถึงถูกจำกัด</h2>
              <p className="denied-subtitle">
                คุณไม่สามารถเข้าถึงส่วนนี้ได้ <br />
                เนื่องจากฟีเจอร์นี้เปิดให้ใช้งานเฉพาะสมาชิกเท่านั้น
              </p>
              <div className="denied-actions">
                <Link to="/login" className="btn-denied-main" onClick={() => setShowAccessDenied(false)}>
                  สมัครสมาชิก / เข้าสู่ระบบ
                </Link>
                <Link to="/class-test" className="btn-denied-secondary" onClick={() => setShowAccessDenied(false)}>
                  ทำแบบทดสอบหาอาชีพแทน
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="nav-container">
          {/* Left Side: Logo and Title */}
          <Link to="/" className="logo">
            <img src={logo} alt="D&D Companion Logo" className="logo-icon" />
            <div className="logo-text">
              <span className="title">DUNGEON TOOLKIT</span>
              <span className="subtitle">Adventure Tools</span>
            </div>
          </Link>

          {/* Right Side Group: Menu + Auth Buttons */}
          <div className="nav-right">
            <div className="menu">
              <Link to="/" className={isActive("/")}>หน้าแรก</Link>
              <Link to="/workshop" className={isActive("/workshop")} onClick={(e) => handleProtectedClick(e, "/workshop")}>เวิร์คช็อป</Link>
              <Link to="/compendium" className={isActive("/compendium")}>คลังข้อมูล</Link>
              <Link to="/sheets" className={isActive("/sheets")} onClick={(e) => handleProtectedClick(e, "/sheets")}>ตัวละครของฉัน</Link>
              <Link to="/how-to-play" className={isActive("/how-to-play")}>วิธีการเล่น</Link>
            </div>

            <div className="auth-buttons">
              {user ? (
                <Link to="/profile" className="user-profile-btn" title="จัดการบัญชี">
                    <div className="nav-avatar-wrapper">
                      <img 
                        src={user.avatar_url || user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                        alt="User Profile" 
                        className="nav-avatar"
                      />
                    </div>
                </Link>
              ) : (
                <Link to="/login" className="user-btn" title="เข้าสู่ระบบ / สมัครสมาชิก">
                  <i className="fa-regular fa-user"></i>
                </Link>
              )}
              
              <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" className={isActive("/")} onClick={() => setIsMobileMenuOpen(false)}>หน้าแรก</Link>
            <Link to="/workshop" className={isActive("/workshop")} onClick={(e) => { setIsMobileMenuOpen(false); handleProtectedClick(e, "/workshop"); }}>เวิร์คช็อป</Link>
            <Link to="/compendium" className={isActive("/compendium")} onClick={() => setIsMobileMenuOpen(false)}>คลังข้อมูล</Link>
            <Link to="/sheets" className={isActive("/sheets")} onClick={(e) => { setIsMobileMenuOpen(false); handleProtectedClick(e, "/sheets"); }}>ตัวละครของฉัน</Link>
            <Link to="/how-to-play" className={isActive("/how-to-play")} onClick={() => setIsMobileMenuOpen(false)}>วิธีการเล่น</Link>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;