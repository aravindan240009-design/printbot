"""Render the original Print Bot folded-paper identity for web favicons and Tauri."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="1" y="1" width="46" height="46" rx="13" fill="#67283f"/><g stroke="#efd5a7" stroke-width="1.65" stroke-linejoin="round" fill="none"><path d="M15 12.5H29L35 18.5V33.5H21L15 27.5V12.5Z"/><path d="M29 12.5V18.5H35"/><path d="M13 21H27V36H13Z" fill="#67283f"/><path d="M17 27H23M17 31H21" stroke-linecap="round"/></g><circle cx="35.5" cy="29" r="1.5" fill="#efd5a7"/></svg>'''
scale = 16
def points(items): return [(round(x*scale), round(y*scale)) for x,y in items]
image = Image.new('RGBA',(48*scale,48*scale))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((scale,scale,47*scale,47*scale), radius=13*scale, fill='#67283f')
gold='#efd5a7'
draw.line(points([(15,12.5),(29,12.5),(35,18.5),(35,33.5),(21,33.5),(15,27.5),(15,12.5)]),fill=gold,width=26,joint='curve')
draw.line(points([(29,12.5),(29,18.5),(35,18.5)]),fill=gold,width=26,joint='curve')
draw.rectangle((13*scale,21*scale,27*scale,36*scale),fill='#67283f',outline=gold,width=26)
for y,x in [(27,23),(31,21)]: draw.line(points([(17,y),(x,y)]),fill=gold,width=24)
draw.ellipse((34*scale,27.5*scale,37*scale,30.5*scale),fill=gold)
for folder in [ROOT/'public',*(ROOT/'apps'/app/'public' for app in ['customer-web','shop-web','superadmin-web','desktop','web'])]:
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'favicon.svg').write_text(SVG,encoding='utf-8')
icons=ROOT/'apps/desktop/src-tauri/icons'
for size in [32,128,256]: image.resize((size,size),Image.Resampling.LANCZOS).save(icons/f'{size}x{size}.png')
image.resize((256,256),Image.Resampling.LANCZOS).save(icons/'icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('Rendered original SVG favicons and PNG/ICO workstation icons.')
