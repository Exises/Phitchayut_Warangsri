import sys

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove priority tag display
start_tag = "<span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800',"
end_tag = "PRIORITY: {selectedItem.priority ? selectedItem.priority.toUpperCase() : 'MEDIUM'}\n                            </span>"

start_idx = text.find(start_tag)
if start_idx != -1:
    end_idx = text.find(end_tag, start_idx)
    if end_idx != -1:
        text = text[:start_idx] + text[end_idx + len(end_tag):]

# Remove Set Priority dropdown
start_select = "<div>\n                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Set Priority:</label>"
end_select = "                                    <option value=\"critical\">Critical</option>\n                                  </select>\n                                </div>"

start_idx2 = text.find(start_select)
if start_idx2 != -1:
    end_idx2 = text.find(end_select, start_idx2)
    if end_idx2 != -1:
        text = text[:start_idx2] + text[end_idx2 + len(end_select):]

with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Removed priority from AdminDashboard.jsx')
