import sys

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

memo_injection = """
  const feedbackStats = useMemo(() => {
    let filtered = feedbackList || [];
    if (feedbackDeviceFilter !== 'All') {
      filtered = filtered.filter(f => f.device_info === feedbackDeviceFilter);
    }
    const total = filtered.length;
    const unread = filtered.filter(f => f.is_read === 0 || f.status === 'new').length;
    
    // Calculate average rating
    const totalRating = filtered.reduce((acc, f) => acc + (parseInt(f.rating) || 5), 0);
    const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';
    
    return { total, unread, avgRating };
  }, [feedbackList, feedbackDeviceFilter]);
"""

target = "  const filteredItems = useMemo(() => {"
start_idx = text.find(target)
if start_idx != -1:
    text = text[:start_idx] + memo_injection + "\n" + text[start_idx:]
    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Successfully added feedbackStats useMemo')
else:
    print('Target not found')
