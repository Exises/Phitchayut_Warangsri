import sys

with open('src/pages/Feedback.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_block = "{/* Priority Dropdown */}"
# Find where this block ends, which is just before the Device Dropdown or next div
end_block = "                                {/* Device Dropdown */}"

start_idx = text.find(start_block)
if start_idx != -1:
    end_idx = text.find(end_block, start_idx)
    if end_idx != -1:
        text = text[:start_idx] + text[end_idx:]

with open('src/pages/Feedback.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Removed priority block from Feedback.jsx')
