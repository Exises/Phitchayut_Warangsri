import React from 'react';
import { useNavigate } from 'react-router-dom';

function Suspended() {
  const navigate = useNavigate();

  const handleReturnToHome = () => {
    localStorage.removeItem('dnd_user');
    navigate('/');
    window.location.reload();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', textAlign: 'center', padding: '20px', 
      backgroundColor: 'var(--bg-paper)', color: 'var(--color-ink)',
      backgroundImage: 'url(/path/to/paper-texture.jpg)', // If they have one, it'll gracefully fallback
      backgroundSize: 'cover'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-white)',
        padding: '50px',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        border: '1px solid var(--border-color, #e5e7eb)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <i className="fa-solid fa-ban" style={{ fontSize: '4rem', color: 'var(--color-red)', marginBottom: '20px' }}></i>
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontFamily: 'var(--font-header)', 
          color: 'var(--color-red)',
          marginBottom: '16px',
          borderBottom: '2px solid var(--color-red)',
          paddingBottom: '16px'
        }}>
          บัญชีถูกระงับการใช้งาน
        </h1>
        
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--color-ink)', 
          marginBottom: '30px', 
          lineHeight: '1.7',
          fontWeight: '500'
        }}>
          โดยคำสั่งจากสภาแห่งดันเจี้ยนมาสเตอร์... บัญชีของคุณถูกระงับการใช้งานชั่วคราวหรือถาวร 
          <br /><br />
          คุณไม่สามารถเข้าถึงระบบบันทึกตัวละครและฐานข้อมูลลับได้ในขณะนี้ หากคุณคิดว่าการระงับนี้เป็นความผิดพลาดจากเวทมนตร์ลวงตา กรุณาติดต่อทีมงาน Support ทันที
        </p>
        
        <button 
          onClick={handleReturnToHome}
          style={{
            backgroundColor: 'var(--color-red)', color: 'var(--bg-white)', border: 'none', padding: '14px 28px', 
            borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(113, 26, 25, 0.3)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-red-dark)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-red)'}
        >
          <i className="fa-solid fa-person-walking-arrow-right"></i> ออกจากที่นี่ในฐานะผู้มาเยือน (Guest)
        </button>
      </div>
    </div>
  );
}

export default Suspended;
