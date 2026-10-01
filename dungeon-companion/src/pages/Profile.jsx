import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { useSettings } from '../context/SettingsContext';
import { ACHIEVEMENTS, getUnlockedBadgeIds, getUserStorageKey } from '../utils/achievementSystem';

function Profile() {
    const { settings, updateSetting } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [user, setUser] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [isEmailLocked, setIsEmailLocked] = useState(true);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [unlockError, setUnlockError] = useState('');
    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        bio: ''
    });
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [destinyHistory, setDestinyHistory] = useState([]);
    const [unlockedBadges, setUnlockedBadges] = useState([]);
    const fileInputRef = React.useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('dnd_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData({
                user_name: parsedUser.user_name || '',
                user_email: parsedUser.user_email || '',
                bio: parsedUser.bio || ''
            });
            fetchUserFeedbacks(parsedUser.user_id);

            const histKey = getUserStorageKey('dnd_destiny_history');
            let storedHistory = localStorage.getItem(histKey);
            if (!storedHistory) {
                const legacyHistory = localStorage.getItem('dnd_destiny_history');
                if (legacyHistory) {
                    localStorage.setItem(histKey, legacyHistory);
                    storedHistory = legacyHistory;
                }
            }
            if (storedHistory) {
                try { setDestinyHistory(JSON.parse(storedHistory)); } catch(e){}
            }

            setUnlockedBadges(getUnlockedBadgeIds());
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleDeleteDestiny = (id) => {
        const updated = destinyHistory.filter(item => item.id !== id);
        setDestinyHistory(updated);
        const histKey = getUserStorageKey('dnd_destiny_history');
        localStorage.setItem(histKey, JSON.stringify(updated));
    };

    const handleViewDestinyResult = (item) => {
        navigate('/class-test-result', { state: item.state });
    };

    const fetchUserFeedbacks = async (userId) => {
        try {
            const res = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_user_feedbacks', user_id: userId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setFeedbacks(data.feedbacks);
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dnd_user');
        navigate('/');
        window.location.reload();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        
        try {
            const response = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_profile',
                    user_id: user.user_id,
                    ...formData
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                localStorage.setItem('dnd_user', JSON.stringify(data.user));
                setUser(data.user);
                setStatusMessage({ type: 'success', text: 'บันทึกการเปลี่ยนแปลงสำเร็จ!' });
                setIsEmailLocked(true);
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'ไม่สามารถบันทึกข้อมูลได้' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ตรวจสอบขนาดไฟล์เบื้องต้นฝั่ง Frontend
        if (file.size > 5 * 1024 * 1024) {
            setStatusMessage({ type: 'error', text: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB' });
            return;
        }

        const formData = new FormData();
        formData.append('user_id', user.user_id);
        formData.append('avatar', file);

        setStatusMessage({ type: 'success', text: 'กำลังอัปโหลด...' });

        try {
            const response = await fetch('http://localhost:5000/api/upload/avatar', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                localStorage.setItem('dnd_user', JSON.stringify(data.user));
                setUser(data.user);
                setStatusMessage({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์สำเร็จ!' });
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'ไม่สามารถอัปโหลดรูปภาพได้' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์อัปโหลด' });
        }
        
        // ล้างค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้
        e.target.value = '';
    };

    const handleDeleteAvatar = async () => {
        if (!user.avatar_url) return; // ไม่มีรูปให้ลบอยู่แล้ว

        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรูปโปรไฟล์?')) return;

        setStatusMessage({ type: 'success', text: 'กำลังลบรูปภาพ...' });

        try {
            const response = await fetch('http://localhost:5000/api/upload/delete_avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id })
            });

            const data = await response.json();

            if (data.status === 'success') {
                localStorage.setItem('dnd_user', JSON.stringify(data.user));
                setUser(data.user);
                setStatusMessage({ type: 'success', text: 'ลบรูปโปรไฟล์สำเร็จ!' });
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'ไม่สามารถลบรูปภาพได้' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        // ตรวจสอบความถูกต้องเบื้องต้น
        if (passwordData.new.length < 8) {
            setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'change_password',
                    user_id: user.user_id,
                    current_password: passwordData.current,
                    new_password: passwordData.new
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setStatusMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ!' });
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
        }
    };

    const handleUnlockEmail = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_password',
                    user_id: user.user_id,
                    password: confirmPassword
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setIsEmailLocked(false);
                setShowUnlockModal(false);
                setConfirmPassword('');
                setUnlockError('');
            } else {
                setUnlockError(data.message || 'รหัสผ่านไม่ถูกต้อง');
            }
        } catch (error) {
            setUnlockError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    };

    if (!user) return null;

    const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

    return (
        <div className="profile-page">
            {/* Modal สำหรับปลดล็อคอีเมล (ดีไซน์ใหม่ - ใช้รหัสผ่าน) */}
            {showUnlockModal && (
                <div className="modal-overlay">
                    <div className="modal-content-minimal animate-slide-down">
                        <div className="unlock-icon-container">
                            <div className="unlock-icon-circle">
                                <i className="fa-solid fa-lock"></i>
                            </div>
                        </div>
                        
                        <div className="modal-body-minimal">
                            <h2 className="modal-title-minimal">ปลดล็อคการแก้ไขอีเมล</h2>
                            <p className="modal-subtitle-minimal">
                                คุณแน่ใจหรือไม่ที่จะเปลี่ยนแปลงอีเมล? <br />
                                กรุณากรอกรหัสผ่านของคุณเพื่อยืนยันตัวตน
                            </p>
                            
                            <div className="minimal-input-wrapper" style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="รหัสผ่านของคุณ" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ paddingRight: '45px' }}
                                />
                                <i 
                                    className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                    style={{ 
                                        position: 'absolute', 
                                        right: '15px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#9ca3af'
                                    }}
                                    onClick={() => setShowPassword(!showPassword)}
                                ></i>
                            </div>
                            
                            {unlockError && <p className="unlock-error-text" style={{ textAlign: 'center', marginBottom: '15px' }}>{unlockError}</p>}
                            
                            <div className="modal-actions-minimal">
                                <button className="btn-minimal-cancel" onClick={() => { setShowUnlockModal(false); setUnlockError(''); setConfirmPassword(''); }}>
                                    Cancel
                                </button>
                                <button className="btn-minimal-unlock" onClick={handleUnlockEmail}>
                                    Unlock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-container">
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-user-card">
                        <img 
                            src={user.avatar_url || user.avatar || defaultAvatar} 
                            alt="User Avatar" 
                            className="profile-avatar-large" 
                        />
                        <h2>{user.user_name}</h2>
                        <p>{user.role || 'ADVENTURER'}</p>
                    </div>

                    <div className="profile-menu">
                        <button 
                            className={`profile-menu-item ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <i className="fa-solid fa-user-gear"></i> ข้อมูลทั่วไป
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'destiny' ? 'active' : ''}`}
                            onClick={() => setActiveTab('destiny')}
                        >
                            <i className="fa-solid fa-scroll"></i> คลังโชคชะตา (Destiny History)
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'badges' ? 'active' : ''}`}
                            onClick={() => setActiveTab('badges')}
                        >
                            <i className="fa-solid fa-award"></i> เหรียญตราความสำเร็จ (Badges)
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="fa-solid fa-shield-halved"></i> ความปลอดภัย
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <i className="fa-solid fa-gear"></i> การตั้งค่า
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'tickets' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tickets')}
                        >
                            <i className="fa-solid fa-headset"></i> ประวัติการแจ้งปัญหา
                        </button>
                        <button 
                            className={`profile-menu-item ${activeTab === 'manage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manage')}
                        >
                            <i className="fa-solid fa-triangle-exclamation"></i> จัดการบัญชี
                        </button>
                    </div>

                    <button className="profile-logout-btn" onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="profile-content">
                    {activeTab === 'general' && (
                        <div className="profile-tab-pane">
                            <div className="profile-tab-header">
                                <h1>ข้อมูลทั่วไป</h1>
                                <p>จัดการข้อมูลส่วนตัวและการแสดงผลบนแพลตฟอร์มของคุณ</p>
                                <hr />
                            </div>

                            <div className="profile-card">
                                {/* Avatar Edit */}
                                <div className="avatar-edit-section">
                                    <div className="avatar-preview-wrapper" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                                        <img src={user.avatar_url || user.avatar || defaultAvatar} alt="Avatar Preview" className="avatar-preview-img" />
                                        <div className="avatar-edit-overlay">
                                            <i className="fa-solid fa-camera"></i>
                                        </div>
                                    </div>
                                    <div className="avatar-actions">
                                        <p className="avatar-actions-title">รูปประจำตัว</p>
                                        <p className="avatar-actions-info">แนะนำขนาด 256x256 px ไฟล์ PNG, JPG, GIF, WebP ไม่เกิน 5MB</p>
                                        <div className="avatar-btns">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                style={{ display: 'none' }} 
                                                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                                            />
                                            <button className="btn-upload" onClick={handleAvatarClick}>อัพโหลดรูปภาพ</button>
                                            <button className="btn-delete" onClick={handleDeleteAvatar}>ลบรูปภาพ</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <form className="profile-form-grid" onSubmit={handleSaveProfile}>
                                    <div className="profile-form-group">
                                        <label>ชื่อผู้ใช้ (Username) <span>*</span></label>
                                        <div className="profile-input-wrapper">
                                            <i className="fa-solid fa-user"></i>
                                            <input 
                                                type="text" 
                                                name="user_name"
                                                value={formData.user_name} 
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-form-group">
                                        <label>อีเมล (Email) <span>*</span></label>
                                        <div className="profile-input-wrapper">
                                            <i className="fa-solid fa-envelope"></i>
                                            <input 
                                                type="email" 
                                                name="user_email"
                                                value={formData.user_email} 
                                                onChange={handleInputChange}
                                                disabled={isEmailLocked} 
                                                required
                                            />
                                            {isEmailLocked && (
                                                <i 
                                                    className="fa-solid fa-lock lock-icon" 
                                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                    onClick={() => setShowUnlockModal(true)}
                                                    title="คลิกเพื่อปลดล็อคการแก้ไขอีเมล"
                                                ></i>
                                            )}
                                        </div>
                                    </div>

                                    <div className="profile-form-group full-width">
                                        <label>ประวัติย่อ (Bio)</label>
                                        <div className="profile-input-wrapper">
                                            <textarea 
                                                name="bio"
                                                value={formData.bio} 
                                                onChange={handleInputChange}
                                                placeholder="บอกเล่าเรื่องราวของคุณเล็กน้อย..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="full-width">
                                        {statusMessage.text && (
                                            <p className={`status-message ${statusMessage.type}`}>
                                                {statusMessage.text}
                                            </p>
                                        )}
                                        <button type="submit" className="btn-save-changes">
                                            <i className="fa-solid fa-floppy-disk"></i> บันทึกการเปลี่ยนแปลง
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="profile-tab-pane">
                            <div className="profile-tab-header">
                                <h1>ความปลอดภัย</h1>
                                <p>จัดการรหัสผ่านและปกป้องบัญชีของคุณ</p>
                                <hr />
                            </div>

                            <div className="profile-card">
                                <h3 className="password-section-title">
                                    <i className="fa-solid fa-key"></i> เปลี่ยนรหัสผ่าน
                                </h3>
                                
                                <form className="password-form" onSubmit={handleChangePassword}>
                                    <div className="profile-form-group">
                                        <label>รหัสผ่านปัจจุบัน</label>
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="password" 
                                                name="current"
                                                placeholder="••••••••" 
                                                value={passwordData.current}
                                                onChange={handlePasswordInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-form-group">
                                        <label>รหัสผ่านใหม่</label>
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="password" 
                                                name="new"
                                                placeholder="••••••••" 
                                                value={passwordData.new}
                                                onChange={handlePasswordInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-form-group">
                                        <label>ยืนยันรหัสผ่านใหม่</label>
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="password" 
                                                name="confirm"
                                                placeholder="••••••••" 
                                                value={passwordData.confirm}
                                                onChange={handlePasswordInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {activeTab === 'security' && statusMessage.text && (
                                        <p className={`status-message ${statusMessage.type}`}>
                                            {statusMessage.text}
                                        </p>
                                    )}

                                    <button type="submit" className="btn-update-password">อัพเดทรหัสผ่าน</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="profile-tab-pane">
                            <div className="profile-tab-header">
                                <h1>การตั้งค่า</h1>
                                <p>ปรับแต่งแอปพลิเคชันให้เข้ากับสไตล์การเล่นของคุณ</p>
                                <hr />
                            </div>

                            <div className="profile-card">
                                <h3><i className="fa-solid fa-dice-d20"></i> ลูกเต๋าและเสียง (Dice & Audio)</h3>
                                
                                <div className="profile-form-group" style={{ marginBottom: '24px' }}>
                                    <label>ธีมลูกเต๋า 3D</label>
                                    <div className="profile-input-wrapper">
                                        <select 
                                            value={settings.diceTheme}
                                            onChange={(e) => updateSetting('diceTheme', e.target.value)}
                                        >
                                            <option value="divine-marble">Divine Marble (หินอ่อนทอง)</option>
                                            <option value="obsidian">Obsidian Void (ดำแดง)</option>
                                            <option value="mystic">Mystic Crystal (ฟ้าคริสตัล)</option>
                                            <option value="fire">Infernal Fire (เพลิงนรก)</option>
                                            <option value="ice">Glacial Frost (น้ำแข็งนิรันดร์)</option>
                                            <option value="gem">Emerald Gem (อัญมณีมรกต)</option>
                                            <option value="wood">Ancient Oak (ไม้โอ๊กโบราณ)</option>
                                            <option value="metal">Steel Plate (เหล็กกล้า)</option>
                                            <option value="glass">Phantom Glass (แก้ววิญญาณ)</option>
                                            <option value="water">Tidal Wave (คลื่นสมุทร)</option>
                                            <option value="earth">Rock Golem (โกเลมหิน)</option>
                                            <option value="air">Storm Cloud (พายุหมอก)</option>
                                            <option value="rust">Rusty Iron (เหล็กขึ้นสนิม)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="setting-toggle-group">
                                    <label className="setting-toggle">
                                        <input 
                                            type="checkbox"
                                            checked={settings.enable3DDice}
                                            onChange={(e) => updateSetting('enable3DDice', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">เปิดใช้งานลูกเต๋า 3D (ปิดเพื่อลดการใช้ทรัพยากรเครื่อง)</span>
                                    </label>
                                </div>

                                <div className="setting-toggle-group">
                                    <label className="setting-toggle">
                                        <input 
                                            type="checkbox"
                                            checked={settings.diceSoundEnabled}
                                            onChange={(e) => updateSetting('diceSoundEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">เสียงลูกเต๋ากระทบโต๊ะ</span>
                                    </label>
                                </div>

                                <div className="setting-toggle-group">
                                    <label className="setting-toggle">
                                        <input 
                                            type="checkbox"
                                            checked={settings.showDebugView || false}
                                            onChange={(e) => updateSetting('showDebugView', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">แสดงหน้าต่าง Debug (Real-time Debug View) ใน Workshop</span>
                                    </label>
                                </div>

                                {settings.diceSoundEnabled && (
                                    <div className="profile-form-group" style={{ marginTop: '16px' }}>
                                        <label>ระดับเสียงทอยลูกเต๋า: {Math.round(settings.diceSoundVolume * 100)}%</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.05"
                                            value={settings.diceSoundVolume}
                                            onChange={(e) => updateSetting('diceSoundVolume', parseFloat(e.target.value))}
                                            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                                        />
                                        <p>ระบบแจ้งเตือนกำลังอยู่ในระหว่างการพัฒนา จะเปิดให้บริการเร็วๆ นี้</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'destiny' && (
                        <div className="profile-tab-pane animate-fade-in">
                            <div className="profile-tab-header">
                                <h1><i className="fa-solid fa-scroll" style={{ color: 'var(--color-red)', marginRight: '10px' }}></i> คลังโชคชะตา (Destiny History)</h1>
                                <p>ประวัติการผจญภัยและผลการวิเคราะห์คลาสจาก AI DM (The Grand Weaver)</p>
                                <hr />
                            </div>

                            {destinyHistory.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                                    <i className="fa-solid fa-dragon" style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                    <h3 style={{ color: '#475569', marginBottom: '8px' }}>ยังไม่มีบันทึกการผจญภัย</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>ลองเข้าทดสอบโหมด AI DM เพื่อถักทอโชคชะตาคลาสของคุณ!</p>
                                    <button className="btn-result-primary" style={{ margin: '0 auto', maxWidth: '220px' }} onClick={() => navigate('/class-test-dm')}>
                                        <i className="fa-solid fa-play"></i> เริ่มเล่น AI DM
                                    </button>
                                </div>
                            ) : (
                                <div className="destiny-history-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                    {destinyHistory.map((item) => (
                                        <div key={item.id} className="destiny-history-card" style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            position: 'relative',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 'bold' }}>
                                                    <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i> {item.date}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: '#fef2f2', color: '#991b1b', fontWeight: '800' }}>
                                                    <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> 10 SCENES AI DM
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                                <div style={{
                                                    width: '60px', height: '60px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #711a19, #991b1b)',
                                                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.8rem', boxShadow: '0 4px 10px rgba(113, 26, 25, 0.3)'
                                                }}>
                                                    <i className={`fa-solid ${item.topClass?.icon || 'fa-shield-halved'}`}></i>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontFamily: 'var(--font-header)' }}>
                                                            {item.topClass?.name || 'UNKNOWN'}
                                                        </h3>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px' }}>
                                                            {item.topClass?.matchPercentage || 85}% MATCH
                                                        </span>
                                                    </div>
                                                    {item.alignment && (
                                                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <i className="fa-solid fa-compass" style={{ color: '#d97706' }}></i>
                                                            <strong>{item.alignment.name}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {item.narrative && (
                                                <p style={{
                                                    fontSize: '0.88rem', color: '#475569', fontStyle: 'italic',
                                                    background: '#f8fafc', padding: '12px 16px', borderRadius: '8px',
                                                    borderLeft: '3px solid #cbd5e1', margin: 0, lineHeight: 1.6
                                                }}>
                                                    "{item.narrative.length > 150 ? item.narrative.substring(0, 150) + '...' : item.narrative}"
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                <button 
                                                    onClick={() => handleViewDestinyResult(item)}
                                                    style={{
                                                        background: '#8b0000', color: '#ffffff', border: 'none',
                                                        padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold',
                                                        fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                                    }}
                                                >
                                                    <i className="fa-solid fa-magnifying-glass"></i> ดูรายละเอียดฉบับเต็ม
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteDestiny(item.id)}
                                                    style={{
                                                        background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5',
                                                        padding: '8px 14px', borderRadius: '6px', fontWeight: '600',
                                                        fontSize: '0.8rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    <i className="fa-solid fa-trash"></i> ลบประวัติ
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="profile-tab-pane animate-fade-in">
                            <div className="profile-tab-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h1><i className="fa-solid fa-award" style={{ color: '#d97706', marginRight: '10px' }}></i> เหรียญตราความสำเร็จ (Class Badges)</h1>
                                        <p>สะสมเหรียญตราคลาสและเกียรติยศจากการทดสอบ AI DM</p>
                                    </div>
                                    <div style={{
                                        background: '#fef3c7', border: '1px solid #fde047', color: '#b45309',
                                        padding: '8px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem'
                                    }}>
                                        <i className="fa-solid fa-trophy" style={{ marginRight: '6px' }}></i>
                                        {unlockedBadges.length} / {ACHIEVEMENTS.length} ปลดล็อคแล้ว ({Math.round((unlockedBadges.length / ACHIEVEMENTS.length) * 100)}%)
                                    </div>
                                </div>
                                <hr />
                            </div>

                            <div className="badges-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                gap: '16px'
                            }}>
                                {ACHIEVEMENTS.map((badge) => {
                                    const isUnlocked = unlockedBadges.includes(badge.id);
                                    return (
                                        <div 
                                            key={badge.id} 
                                            className={"badge-card " + (isUnlocked ? 'badge-unlocked' : 'badge-locked')}
                                            style={{
                                                backgroundColor: isUnlocked ? '#ffffff' : '#f8fafc',
                                                border: isUnlocked ? '1.5px solid #f59e0b' : '1px dashed #cbd5e1',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                position: 'relative',
                                                boxShadow: isUnlocked ? '0 4px 15px rgba(245, 158, 11, 0.15)' : 'none',
                                                opacity: isUnlocked ? 1 : 0.65,
                                                transition: 'all 0.25s'
                                            }}
                                        >
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '50%',
                                                background: isUnlocked ? 'linear-gradient(135deg, #d97706, #b45309)' : '#e2e8f0',
                                                color: isUnlocked ? '#ffffff' : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.8rem', marginBottom: '14px',
                                                boxShadow: isUnlocked ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
                                            }}>
                                                <i className={`fa-solid ${badge.icon}`}></i>
                                            </div>

                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: isUnlocked ? '#d97706' : '#94a3b8', marginBottom: '4px' }}>
                                                {badge.subTitle}
                                            </span>

                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: isUnlocked ? '#1e293b' : '#64748b', fontFamily: 'var(--font-header)' }}>
                                                {badge.title}
                                            </h4>

                                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>
                                                {badge.desc}
                                            </p>

                                            <div style={{ marginTop: '14px', width: '100%', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                                {isUnlocked ? (
                                                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '12px' }}>
                                                        <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> ปลดล็อคแล้ว
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '12px' }}>
                                                        <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i> ยังไม่ปลดล็อค
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="profile-tab-pane">
                            <div className="profile-tab-header">
                                <h1>ประวัติการแจ้งปัญหา</h1>
                                <p>ติดตามสถานะและข้อความตอบกลับจากแอดมิน</p>
                                <hr />
                            </div>
                            
                            <div className="profile-card" style={{ padding: 0, backgroundColor: 'transparent', boxShadow: 'none' }}>
                                {feedbacks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <i className="fa-solid fa-inbox" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                        <h3 style={{ color: '#475569' }}>ยังไม่มีประวัติการแจ้งปัญหา</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>คุณสามารถส่งข้อเสนอแนะหรือแจ้งปัญหาได้ที่หน้า Support Portal</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {feedbacks.map(fb => (
                                            <div key={fb.feedback_id} style={{ 
                                                backgroundColor: '#fff', 
                                                borderRadius: '12px', 
                                                border: '1px solid #e2e8f0', 
                                                padding: '20px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: 0, top: 0, bottom: 0, width: '4px', 
                                                    backgroundColor: fb.status === 'resolved' ? '#10b981' : (fb.status === 'in_review' ? '#f59e0b' : '#3b82f6') 
                                                }}></div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                            <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                                TICKET #{fb.feedback_id}
                                                            </span>
                                                            <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: fb.status === 'resolved' ? '#d1fae5' : (fb.status === 'in_review' ? '#fef3c7' : '#dbeafe'), color: fb.status === 'resolved' ? '#059669' : (fb.status === 'in_review' ? '#d97706' : '#2563eb') }}>
                                                                {fb.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>{fb.title}</h3>
                                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                                                            {new Date(fb.created_at).toLocaleString('th-TH')} • หมวดหมู่: {fb.category.toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155', marginBottom: fb.admin_response ? '16px' : '0' }}>
                                                    {fb.message}
                                                </div>

                                                {fb.admin_response && (
                                                    <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', borderLeft: '4px solid #3b82f6' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1e40af', fontWeight: '700', fontSize: '0.85rem' }}>
                                                            <i className="fa-solid fa-headset"></i> ตอบกลับจากทีมงาน (Admin)
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>
                                                            {fb.admin_response}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div className="profile-tab-pane">
                            <div className="profile-tab-header">
                                <h1>จัดการบัญชี</h1>
                                <p>จัดการข้อมูลของคุณ</p>
                                <hr />
                            </div>
                            <div className="profile-card">
                                <h3><i className="fa-solid fa-database"></i> ข้อมูลและระบบ</h3>
                                <p style={{ marginBottom: '15px' }}>ล้างข้อมูลขยะที่เกิดจากการทำงานของลูกเต๋า 3D หรือล้างประวัติการทอยเต๋า</p>
                                <button className="btn-delete" onClick={() => {
                                    localStorage.removeItem('dnd_settings');
                                    alert('คืนค่าการตั้งค่าเริ่มต้นเรียบร้อยแล้ว!');
                                    window.location.reload();
                                }}>
                                    <i className="fa-solid fa-trash-can"></i> คืนค่าการตั้งค่าทั้งหมด
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;


