import sys

with open('src/pages/Feedback.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove priority state
text = text.replace("const [priority, setPriority] = useState('medium');\n", "")
# Replace priority in fetch payload with default or remove it (I'll keep sending 'medium' to backend so it doesn't break api, though the backend has priority || 'medium')
text = text.replace("priority: priority,", "priority: 'medium',")

# Remove the priority dropdown block
start_block = "{/* Priority Dropdown */}"
end_block = "                            </div>"

start_idx = text.find(start_block)
if start_idx != -1:
    # Find the next closing div of this block
    # It starts at 171: <div>. We need to find the matching </div>
    # Actually, we can just find the Device Dropdown and cut until there.
    end_idx = text.find("{/* Device Dropdown */}", start_idx)
    if end_idx != -1:
        text = text[:start_idx] + text[end_idx:]

with open('src/pages/Feedback.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Removed priority from Feedback.jsx')
