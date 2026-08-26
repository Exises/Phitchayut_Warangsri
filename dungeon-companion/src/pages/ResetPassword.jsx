import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // ดึง token จาก URL (เช่น ?token=abcd)
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        if (!token) {
            Swal.fire('ข้อผิดพลาด', 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือไม่มี Token', 'error').then(() => {
                navigate('/login');
            });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return Swal.fire('ข้อผิดพลาด', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน', 'error');
        }
        if (newPassword.length < 6) {
            return Swal.fire('ข้อผิดพลาด', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword })
            });
            const data = await response.json();

            if (data.status === 'success') {
                Swal.fire('สำเร็จ!', 'รีเซ็ตรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาล็อกอินด้วยรหัสผ่านใหม่', 'success').then(() => {
                    navigate('/login');
                });
            } else {
                Swal.fire('ผิดพลาด', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', backgroundColor: 'var(--bg-cream)' }}>
            <div style={{ backgroundColor: 'var(--bg-white)', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', color: 'var(--color-red)', marginBottom: '20px' }}>ตั้งรหัสผ่านใหม่</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รหัสผ่านใหม่:</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ยืนยันรหัสผ่านใหม่:</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            padding: '12px', 
                            backgroundColor: 'var(--color-red)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
