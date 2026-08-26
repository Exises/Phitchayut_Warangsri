import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    // ถ้าล็อกอินเป็นแอดมินอยู่แล้วให้ไปหน้า dashboard เลย
    useEffect(() => {
        const storedAdmin = localStorage.getItem('dnd_admin');
        if (storedAdmin) {
            const admin = JSON.parse(storedAdmin);
            if (admin.role === 'admin') {
                navigate('/admin');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });
            const data = await response.json();

            if (data.status === 'error' || data.error) {
                setMessage({ type: 'error', text: data.message || data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            } else {
                // ตรวจสอบว่ามีสิทธิ์แอดมินหรือไม่
                if (data.user.role === 'admin') {
                    setMessage({ type: 'success', text: 'ยืนยันตัวตนสำเร็จ กำลังเข้าสู่ระบบจัดการ...' });
                    localStorage.setItem('dnd_admin', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        navigate('/admin');
                        window.location.reload();
                    }, 1000);
                } else {
                    setMessage({ type: 'error', text: 'ขออภัย คุณไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ' });
                }
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
        }
    };

    return (
        <div className="admin-login-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-ink)', // Darker theme for admin
            padding: '20px'
        }}>
            <div className="admin-login-card" style={{
                backgroundColor: 'var(--color-ink)',
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #374151'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <img 
                        src={logo} 
                        alt="Logo" 
                        style={{ 
                            display: 'block',
                            margin: '0 auto 15px auto',
                            width: '80px', 
                            filter: 'brightness(0) invert(1)' 
                        }} 
                    />
                    <h2 style={{ 
                        fontFamily: 'var(--font-header)', 
                        color: '#fff', 
                        fontSize: '1.5rem',
                        letterSpacing: '2px'
                    }}>
                        เข้าสู่ระบบแอดมิน
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '5px' }}>
                        ระบบจัดการ Dungeon Toolkit (ADMIN ONLY)
                    </p>
                </div>

                {message.text && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: message.type === 'error' ? '#7f1d1d' : '#064e3b',
                        color: message.type === 'error' ? '#fecaca' : '#d1fae5',
                        border: `1px solid ${message.type === 'error' ? '#991b1b' : '#059669'}`,
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-container" style={{ marginBottom: '20px' }}>
                        <label style={{ color: 'var(--border-color)', display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>อีเมลแอดมิน</label>
                        <div className="input-with-icon">
                            <i className="fa-solid fa-user-shield" style={{ color: 'var(--color-gray)' }}></i>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder=""
                                required
                                style={{ backgroundColor: 'var(--color-ink)', border: '1px solid #374151', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <div className="input-container" style={{ marginBottom: '30px' }}>
                        <label style={{ color: 'var(--border-color)', display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>รหัสผ่าน</label>
                        <div className="input-with-icon">
                            <i className="fa-solid fa-key" style={{ color: 'var(--color-gray)' }}></i>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=""
                                required
                                style={{ backgroundColor: 'var(--color-ink)', border: '1px solid #374151', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-auth-submit" style={{ 
                        backgroundColor: '#711a19', 
                        width: '100%',
                        borderRadius: '4px',
                        padding: '15px'
                    }}>
                        ยืนยันตัวตน <i className="fa-solid fa-shield-halved" style={{ marginLeft: '10px' }}></i>
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <a href="/" style={{ color: 'var(--color-gray)', fontSize: '0.8rem', textDecoration: 'none' }}>
                            <i className="fa-solid fa-arrow-left"></i> กลับสู่หน้าหลัก
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminLogin;

