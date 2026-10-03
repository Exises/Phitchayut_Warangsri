import sys

with open('src/components/WorkshopCharacterBuilder.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("background: '#0f172a', color: '#f8fafc'", "background: '#fdf9ec', color: '#333333'")
text = text.replace("background: '#0f172a',\n      color: '#f8fafc'", "background: '#fdf9ec',\n      color: '#333333'")

with open('src/components/WorkshopCharacterBuilder.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated Swal theme to parchment successfully.')
