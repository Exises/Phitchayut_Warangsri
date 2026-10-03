import sys

with open('src/components/WorkshopCharacterBuilder.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any occurrence of the dark colors that belong to Swal configs in this file
text = text.replace("'#0f172a'", "'#fdf9ec'")
text = text.replace("'#f8fafc'", "'#333333'")

with open('src/components/WorkshopCharacterBuilder.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated all remaining Swal themes to parchment successfully.')
