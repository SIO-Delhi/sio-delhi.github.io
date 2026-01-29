from PIL import Image
import os, sys

src = os.path.join('dist', 'logo.png')
if not os.path.exists(src):
    print('Source image not found:', src)
    sys.exit(1)

img = Image.open(src).convert('RGBA')

# Create favicon.ico with multiple sizes
ico_path = os.path.join('dist', 'favicon.ico')
sizes = [(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)]
try:
    img.save(ico_path, sizes=sizes)
    print('Wrote', ico_path)
except Exception as e:
    print('Failed to write ico:', e)

# Create apple-touch-icon.png
apple_path = os.path.join('dist', 'apple-touch-icon.png')
try:
    img.resize((180,180), Image.LANCZOS).save(apple_path, format='PNG')
    print('Wrote', apple_path)
except Exception as e:
    print('Failed to write apple-touch-icon:', e)
