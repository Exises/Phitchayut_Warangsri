import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('dnd_user');
        setIsLoggedIn(!!user);
    }, []);

    const handleProtectedClick = (e, path) => {
        if (!isLoggedIn) {
            e.preventDefault();
            setShowAccessDenied(true);
        }
    };

    return (
        <div className="page-home">
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
                                <button className="btn-denied-main" onClick={() => navigate('/login')}>
                                    สมัครสมาชิก / เข้าสู่ระบบ
                                </button>
                                <button className="btn-denied-secondary" onClick={() => { setShowAccessDenied(false); navigate('/class-test'); }}>
                                    ทำแบบทดสอบหาอาชีพแทน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="tag-container">
                        <div className="tag-line"></div>
                        <span className="tag">The Adventure Begins</span>
                        <div className="tag-line"></div>
                    </div>
                    <h1>Forge Your <span className="highlight-red">Legend</span></h1>
                    <p>เว็บแอปพลิเคชันสำหรับ Dungeon Master และผู้เล่น<br />รวมเครื่องมือครบจบในที่เดียว ใช้งานง่าย สบายตา</p>
                    <div className="button-group">
                        <Link 
                            to="/workshop" 
                            className="btn btn-primary"
                            onClick={(e) => handleProtectedClick(e, '/workshop')}
                        >
                            <i className="fa-solid fa-hammer"></i> เข้าสู่ WORKSHOP
                        </Link>
                        <Link to="/compendium" className="btn btn-secondary"><i className="fa-solid fa-book-open"></i> ค้นหากฎ</Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <i className="fa-solid fa-diamond"></i>
                    <h2>ฟีเจอร์หลัก</h2>
                </div>

                <div className="card-grid">
                    <Link 
                        to="/workshop" 
                        className="card"
                        onClick={(e) => handleProtectedClick(e, '/workshop')}
                    >
                        <div className="card-icon"><i className="fa-solid fa-hammer"></i></div>
                        <h3 className="card-title">WORKSHOP</h3>
                        <p>สร้างตัวละคร NPC และไอเทมเวทมนตร์สำหรับแคมเปญของคุณ</p>
                        <div className="card-link">เริ่มสร้าง <i className="fa-solid fa-arrow-right"></i></div>
                    </Link>

                    <Link to="/compendium" className="card">
                        <div className="card-icon"><i className="fa-solid fa-book-skull"></i></div>
                        <h3 className="card-title">COMPENDIUM</h3>
                        <p>ค้นหาคาถา มอนสเตอร์ และกฎ 5th Edition ได้ทันที</p>
                        <div className="card-link">ค้นหา <i className="fa-solid fa-arrow-right"></i></div>
                    </Link>

                    <Link 
                        to="/sheets" 
                        className="card"
                        onClick={(e) => handleProtectedClick(e, '/sheets')}
                    >
                        <div className="card-icon"><i className="fa-solid fa-shield-halved"></i></div>
                        <h3 className="card-title">CHARACTER VAULT</h3>
                        <p>เก็บข้อมูลตัวละครของคุณไว้อย่างปลอดภัย</p>
                        <div className="card-link">ดูตัวละคร <i className="fa-solid fa-arrow-right"></i></div>
                    </Link>

                    <Link to="/class-test" className="card">
                        <div className="card-icon"><i className="fa-solid fa-clipboard-list"></i></div>
                        <h3 className="card-title">CLASS TEST</h3>
                        <p>ทำแบบทดสอบเพื่อบอกว่าคุณเหมาะกับคลาสอะไร</p>
                        <div className="card-link">เริ่มทำแบบทดสอบ <i className="fa-solid fa-arrow-right"></i></div>
                    </Link>

                    <Link to="/feedback" className="card" onClick={(e) => handleProtectedClick(e, '/feedback')}>
                        <div className="card-icon"><i className="fa-solid fa-envelope-open-text"></i></div>
                        <h3 className="card-title">FEEDBACK</h3>
                        <p>ส่งข้อเสนอแนะเพื่อพัฒนาระบบ</p>
                        <div className="card-link">ส่งข้อเสนอแนะ <i className="fa-solid fa-arrow-right"></i></div>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Home;