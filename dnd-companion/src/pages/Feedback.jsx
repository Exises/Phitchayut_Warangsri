import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Feedback() {
    const [rating, setRating] = useState(5);
    const [category, setCategory] = useState('general');
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');
    const [deviceInfo, setDeviceInfo] = useState('Desktop');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('dnd_user');
        if (!user) {
            setIsLoggedIn(false);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setStatus({ type: 'error', text: 'กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน' });
            return;
        }

        const userStr = localStorage.getItem('dnd_user');
        if (!userStr) {
            setStatus({ type: 'error', text: 'Authentication Required' });
            return;
        }

        const user = JSON.parse(userStr);
        setIsSubmitting(true);
        setStatus({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5000/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit_feedback',
                    user_id: user.user_id,
                    user_name: user.user_name,
                    rating: rating,
                    category: category,
                    title: title,
                    priority: priority,
                    device_info: deviceInfo,
                    message: message
                })
            });
            const data = await response.json();

            if (data.status === 'success') {
                setIsSubmitted(true);
                setMessage('');
                setTitle('');
                setRating(5);
            } else {
                setStatus({ type: 'error', text: data.message || 'System Error. Please try again.' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'Connection failed. Please check your network.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#f1f5f9', padding: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '450px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#ef4444', fontSize: '24px' }}>
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <h2 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>Authentication Required</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '32px' }}>
                        You need an active user account to access the Support Portal and submit tickets.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/login" style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}>
                            Sign In / Register
                        </Link>
                        <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#f8fafc', color: '#475569', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fa-solid fa-headset text-blue-600"></i> Support Portal
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
                        Submit a ticket. Our team will review your request and get back to you.
                    </p>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Form Header */}
                    <div style={{ backgroundColor: '#f1f5f9', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155', margin: 0 }}>
                            New Support Ticket
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                            <i className="fa-regular fa-clock"></i> {new Date().toLocaleDateString('en-GB')}
                        </span>
                    </div>

                    {isSubmitted ? (
                        /* Success State */
                        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <div style={{ width: '72px', height: '72px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', fontSize: '2rem' }}>
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Ticket Submitted Successfully</h2>
                            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
                                Your feedback has been securely logged into our system. An administrator will review it shortly.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <button onClick={() => setIsSubmitted(false)} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}>
                                    Submit Another Ticket
                                </button>
                                <button onClick={() => navigate('/')} style={{ padding: '10px 20px', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleSubmit} style={{ padding: '32px 24px' }}>
                            {status.text && (
                                <div style={{ padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: status.type === 'error' ? '#fef2f2' : '#ecfdf5', color: status.type === 'error' ? '#991b1b' : '#065f46', border: `1px solid ${status.type === 'error' ? '#fecaca' : '#a7f3d0'}` }}>
                                    <i className={`fa-solid ${status.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
                                    {status.text}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                {/* Category Dropdown */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Ticket Type <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="general">General Inquiry</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="ui">UI / UX Feedback</option>
                                        <option value="bug">Bug Report</option>
                                    </select>
                                </div>

                                {/* Priority Dropdown */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Priority Level <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical (System Down)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                {/* Title Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Subject <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Brief summary of the issue..."
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
                                    />
                                </div>

                                {/* Device Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Environment
                                    </label>
                                    <select
                                        value={deviceInfo}
                                        onChange={(e) => setDeviceInfo(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="Desktop">Desktop</option>
                                        <option value="Mobile (iOS)">iOS Device</option>
                                        <option value="Mobile (Android)">Android Device</option>
                                        <option value="Tablet">Tablet</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Message Textarea */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                    Description <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows="6"
                                    placeholder="Please provide detailed information about your request..."
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', minHeight: '120px' }}
                                ></textarea>
                                <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Please include any error codes or steps to reproduce if reporting a bug.</p>
                            </div>

                            {/* Satisfaction Rating - Segmented Control Style */}
                            <div style={{ marginBottom: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
                                    Overall Satisfaction
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { val: 1, icon: 'fa-face-frown', label: 'Poor' },
                                        { val: 2, icon: 'fa-face-frown-open', label: 'Fair' },
                                        { val: 3, icon: 'fa-face-meh', label: 'Neutral' },
                                        { val: 4, icon: 'fa-face-smile', label: 'Good' },
                                        { val: 5, icon: 'fa-face-laugh-beam', label: 'Excellent' },
                                    ].map((item) => (
                                        <div 
                                            key={item.val}
                                            onClick={() => setRating(item.val)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '12px 8px',
                                                border: `1px solid ${rating === item.val ? '#3b82f6' : '#e2e8f0'}`,
                                                borderRadius: '8px',
                                                backgroundColor: rating === item.val ? '#eff6ff' : '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                color: rating === item.val ? '#2563eb' : '#64748b'
                                            }}
                                        >
                                            <i className={`fa-regular ${item.icon}`} style={{ fontSize: '1.5rem' }}></i>
                                            <span style={{ fontSize: '0.75rem', fontWeight: rating === item.val ? '600' : '400' }}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    style={{ padding: '10px 24px', backgroundColor: 'transparent', color: '#64748b', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.2s' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{ padding: '10px 32px', backgroundColor: isSubmitting ? '#94a3b8' : '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.95rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                >
                                    {isSubmitting ? (
                                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Submitting...</>
                                    ) : (
                                        <><i className="fa-solid fa-paper-plane"></i> Submit Ticket</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Feedback;
