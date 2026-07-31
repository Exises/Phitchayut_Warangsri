import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function AdminNavbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('dnd_admin');
        navigate('/admin-login');
        window.location.reload();
    };

    return (
        <nav className="admin-navbar" style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--bg-white)',
            padding: '10px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={logo} alt="Admin Logo" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
                <div>
                    <h1 style={{ 
                        fontFamily: 'var(--font-header)', 
                        fontSize: '1.2rem', 
                        margin: 0,
                        letterSpacing: '1px'
                    }}>
                        ADMIN DASHBOARD
                    </h1>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                        Dungeon Toolkit Database Management
                    </span>
                </div>
            </div>

            <div className="admin-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/admin" style={{ color: 'var(--border-color)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-database"></i> จัดการฐานข้อมูล
                </Link>
                <button 
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#711a19',
                        color: 'var(--bg-white)',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                </button>
            </div>
        </nav>
    );
}

export default AdminNavbar;
