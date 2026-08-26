import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function Login() {
    const [mode, setMode] = useState('signin');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    // โหลดอีเมลที่บันทึกไว้จาก localStorage (ถ้ามี)
    useEffect(() => {
        const savedEmail = localStorage.getItem('dnd_remembered_email');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRememberChange = (e) => {
        setRememberMe(e.target.checked);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (mode === 'signup') {
            const engNumRegex = /^[a-zA-Z0-9]+$/;
            
            if (formData.username.length < 5 || !engNumRegex.test(formData.username)) {
                setMessage({ type: 'error', text: 'Username ต้องมีอย่างน้อย 5 ตัวอักษร และใช้ได้แค่ภาษาอังกฤษและตัวเลข' });
                return;
            }

            if (formData.password.length < 8 || !engNumRegex.test(formData.password)) {
                setMessage({ type: 'error', text: 'Password ต้องมีอย่างน้อย 8 ตัวอักษร และใช้ได้แค่ภาษาอังกฤษและตัวเลข' });
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'register',
                        username: formData.username,
                        email: formData.email,
                        password: formData.password
                    })
                });
                const data = await response.json();

                if (data.status === 'error' || data.error) {
                    setMessage({ type: 'error', text: data.message || data.error });
                } else {
                    setMessage({ type: 'success', text: data.message || data.success || 'สมัครสมาชิกสำเร็จ!' });
                    setMode('signin');
                    setFormData({ username: '', email: '', password: '' });
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
            }
        } else {
            // Sign In Logic
            try {
                const response = await fetch('http://localhost:5000/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'login',
                        email: formData.email,
                        password: formData.password
                    })
                });
                const data = await response.json();

                if (data.status === 'error' || data.error) {
                    setMessage({ type: 'error', text: data.message || data.error });
                } else {
                    if (data.user.role === 'admin') {
                        setMessage({ type: 'error', text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาใส่ใหม่อีครั้ง' });
                        return;
                    }

                    // จัดการ Remember Me
                    if (rememberMe) {
                        localStorage.setItem('dnd_remembered_email', formData.email);
                    } else {
                        localStorage.removeItem('dnd_remembered_email');
                    }

                    setMessage({ type: 'success', text: 'เข้าสู่ระบบสำเร็จ กำลังพาคุณไปหน้าหลัก...' });
                    localStorage.setItem('dnd_user', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        navigate('/');
                        window.location.reload();
                    }, 1000);
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
            }
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-split-card animate-fade-in">
                <button className="auth-close-btn" onClick={() => navigate('/')}>
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="auth-left-panel">
                    <img src={logo} alt="Dungeon Toolkit Logo" className="auth-left-logo" />
                    <h1>DUNGEON TOOLKIT</h1>
                    <p>ปลดล็อกคลังข้อมูลเวทมนตร์ และจัดการตัวละครของคุณ เข้าสู่โลกแห่งการผจญภัยอย่างไร้ขีดจำกัด</p>
                </div>

                <div className="auth-right-panel">
                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                            onClick={() => { setMode('signin'); setMessage({type:'', text:''}); }}
                        >
                            SIGN IN
                        </button>
                        <button 
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setMessage({type:'', text:''}); }}
                        >
                            CREATE ACCOUNT
                        </button>
                    </div>

                    <div className="auth-form-body">
                        {message.text && (
                            <div className={`auth-alert ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {mode === 'signup' && (
                                <div className="input-container">
                                    <label>Character / Username <span>*</span></label>
                                    <div className="input-with-icon">
                                        <i className="fa-solid fa-user"></i>
                                        <input 
                                            type="text" 
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Endel Draconis" 
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="input-container">
                                <label>Email Address <span>*</span></label>
                                <div className="input-with-icon">
                                    <i className="fa-solid fa-envelope"></i>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="traveler@fearun.com" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="input-container">
                                <label>Password <span>*</span></label>
                                <div className="input-with-icon">
                                    <i className="fa-solid fa-lock"></i>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password"
                                        className="with-toggle"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={mode === 'signin' ? '••••••••' : 'Create a strong password'} 
                                        required 
                                    />
                                    {formData.password && (
                                        <button 
                                            type="button" 
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {mode === 'signin' && (
                                <div className="auth-options">
                                    <label className="remember-me">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe}
                                            onChange={handleRememberChange}
                                        /> Remember me
                                    </label>
                                    <a 
                                        href="#" 
                                        className="forgot-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            import('sweetalert2').then(Swal => {
                                                Swal.default.fire({
                                                    title: 'ลืมรหัสผ่าน',
                                                    text: 'กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน',
                                                    input: 'email',
                                                    inputPlaceholder: 'อีเมลของคุณ',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#711a19',
                                                    cancelButtonColor: '#9ca3af',
                                                    confirmButtonText: 'ส่งลิงก์',
                                                    cancelButtonText: 'ยกเลิก',
                                                    showLoaderOnConfirm: true,
                                                    preConfirm: (email) => {
                                                        return fetch('http://localhost:5000/api/auth/forgot-password', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ email })
                                                        })
                                                        .then(response => {
                                                            if (!response.ok) {
                                                                throw new Error(response.statusText)
                                                            }
                                                            return response.json()
                                                        })
                                                        .catch(error => {
                                                            Swal.default.showValidationMessage(`เกิดข้อผิดพลาด: ${error}`)
                                                        })
                                                    },
                                                    allowOutsideClick: () => !Swal.default.isLoading()
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        const resData = result.value;
                                                        if (resData.status === 'success') {
                                                            Swal.default.fire('ส่งสำเร็จ!', resData.message, 'success');
                                                        } else {
                                                            Swal.default.fire('ผิดพลาด', resData.message, 'error');
                                                        }
                                                    }
                                                });
                                            });
                                        }}
                                    >Forgot Password?</a>
                                </div>
                            )}

                            <div style={{ marginTop: '25px' }}>
                                {mode === 'signin' ? (
                                    <button type="submit" className="btn-auth-submit">
                                        ENTER THE REALM <i className="fa-solid fa-arrow-right-to-bracket" style={{ fontSize: '0.8rem' }}></i>
                                    </button>
                                ) : (
                                    <button type="submit" className="btn-auth-signup">
                                        FORGE YOUR LEGEND <i className="fa-solid fa-hammer" style={{ fontSize: '0.8rem' }}></i>
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

