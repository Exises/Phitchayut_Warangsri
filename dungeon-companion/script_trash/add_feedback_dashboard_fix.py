import sys

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Inject UI
ui_injection = """
              {/* FEEDBACK KPI SUMMARY DASHBOARD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="admin-kpi-card glow-blue" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>เรตติ้งเฉลี่ย (Average)</span>
                    <i className="fa-solid fa-star" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.avgRating} <span style={{fontSize:'1rem', color:'#64748b'}}>/ 5</span></div>
                  
                  {/* Device Filter inside Rating card for UI compactness */}
                  <select 
                    value={feedbackDeviceFilter}
                    onChange={(e) => setFeedbackDeviceFilter(e.target.value)}
                    style={{ marginTop: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                  >
                    <option value="All">ทุกอุปกรณ์ (All Devices)</option>
                    <option value="คอมพิวเตอร์ / โน้ตบุ๊ก (Desktop)">คอมพิวเตอร์ / โน้ตบุ๊ก (Desktop)</option>
                    <option value="ไอโฟน / ไอแพด (iOS)">ไอโฟน / ไอแพด (iOS)</option>
                    <option value="สมาร์ทโฟน Android">สมาร์ทโฟน Android</option>
                    <option value="แท็บเล็ต (Tablet)">แท็บเล็ต (Tablet)</option>
                    <option value="อื่นๆ (Other)">อื่นๆ (Other)</option>
                  </select>
                </div>

                <div className="admin-kpi-card glow-purple" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>ข้อความทั้งหมด</span>
                    <i className="fa-solid fa-envelope" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.total}</div>
                </div>

                <div className="admin-kpi-card glow-red" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>รอการตรวจสอบ (Unread)</span>
                    <i className="fa-solid fa-bell" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.unread}</div>
                </div>
              </div>
"""

target_marker = "              <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>"
start_idx = text.find(target_marker)
if start_idx != -1:
    text = text[:start_idx] + ui_injection + text[start_idx:]
    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Successfully added feedback dashboard summary to AdminDashboard.jsx')
else:
    print('Could not find target marker')
