import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FDIR = sys.argv[1]; OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
def font(w): return TTFont(f'{FDIR}/plus-jakarta-sans-latin-{w}-normal.woff2')
F800, F700 = font(800), font(700)

def text_path(f, s, size, x, y, tracking=0):
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    sc = size / upm; d = []; cx = x
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (sc, 0, 0, -sc, cx, y))
        gs[g].draw(tp)
        d.append(pen.getCommands())
        cx += gs[g].width * sc + tracking
    return ' '.join(d), cx - tracking

# Palet
TEAL='#0E6E66'; TEAL_D='#0A4F4A'; RED='#C8102E'; INK='#13232B'; CHALK='#F6F8F7'; PAPER='#FFFDF7'

def mark(x=0, y=0, s=1, board=TEAL, clip=RED, check='#FFFFFF', hole=None):
    hole = hole or board
    return f'''<g transform="translate({x} {y}) scale({s})">
  <rect x="6" y="10" width="52" height="50" rx="14" fill="{board}"/>
  <rect x="21" y="3" width="22" height="13" rx="5" fill="{clip}"/>
  <circle cx="32" cy="9.5" r="2.6" fill="{hole}"/>
  <path d="M19.5 36.5 L28.5 45.5 L45 27" fill="none" stroke="{check}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>'''

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

def wordmark(x, base, size, ink, red, sdText='#FFFFFF'):
    p1, end = text_path(F800, 'Ceklis', size, x, base, tracking=-size*0.02)
    gap = size*0.18; px = end + gap
    sd, sdEnd = text_path(F800, 'SD', size*0.62, px + size*0.2, base - size*0.06)
    pw = (sdEnd - px) + size*0.2; ph = size*0.82
    pill = f'<rect x="{px:.1f}" y="{base - size*0.06 - size*0.62*0.72 - size*0.12 - (ph - size*0.62*0.72 - size*0.24)/2:.1f}" width="{pw:.1f}" height="{ph*0.78:.1f}" rx="{ph*0.2:.1f}" fill="{red}"/>'
    return f'<path d="{p1}" fill="{ink}"/>{pill}<path d="{sd}" fill="{sdText}"/>', px + pw

files = {}
files['logo-mark.svg'] = svg(64, 64, mark(), 'Ceklis SD')
files['logo-mark-mono.svg'] = svg(64, 64, mark(board='#13232B', clip='#13232B', hole='#FFFFFF'), 'Ceklis SD')
files['logo-mark-reverse.svg'] = svg(64, 64, mark(board='#FFFFFF', clip=RED, check=TEAL, hole='#FFFFFF'), 'Ceklis SD')

wm, end = wordmark(78, 46, 40, INK, RED)
W = int(end + 6)
files['logo-horizontal.svg'] = svg(W, 64, mark() + wm, 'Ceklis SD')
wm2, _ = wordmark(78, 46, 40, '#FFFFFF', RED)
files['logo-horizontal-reverse.svg'] = svg(W, 64, mark(board='#FFFFFF', clip=RED, check=TEAL, hole='#FFFFFF') + wm2, 'Ceklis SD')
wm3, _ = wordmark(78, 46, 40, INK, INK)
files['logo-horizontal-mono.svg'] = svg(W, 64, mark(board=INK, clip=INK, hole='#FFFFFF') + wm3, 'Ceklis SD')

# Stacked + tagline
wm4, e4 = wordmark(0, 0, 40, INK, RED)
tag, te = text_path(F700, 'Checklist & template administrasi SD', 13, 0, 0)
sw = max(e4, te)
files['logo-stacked.svg'] = svg(int(sw)+20, 170, mark((sw+20)/2-40, 4, 1.25) + f'<g transform="translate({(sw+20-e4)/2:.1f} 128)">{wm4}</g><g transform="translate({(sw+20-te)/2:.1f} 158)"><path d="{tag}" fill="#4B5D66"/></g>', 'Ceklis SD')

# Favicon (32 grid, tebal)
files['favicon.svg'] = svg(64, 64, '''<rect x="4" y="9" width="56" height="53" rx="14" fill="#0E6E66"/><rect x="19" y="2" width="26" height="14" rx="5" fill="#C8102E"/><path d="M18 37 L28.5 47.5 L46.5 27" fill="none" stroke="#FFFFFF" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>''', 'Ceklis SD')

# OG image 1200x630
wm5, e5 = wordmark(0, 0, 96, '#FFFFFF', RED)
t1, t1e = text_path(F700, 'Checklist & template administrasi', 40, 0, 0)
t2, _ = text_path(F700, 'untuk operator, kepala sekolah, dan bendahara SD', 30, 0, 0)
og = f'''<rect width="1200" height="630" fill="{TEAL}"/>
<g opacity="0.07" stroke="#FFFFFF" stroke-width="2">{''.join(f'<line x1="0" y1="{y}" x2="1200" y2="{y}"/>' for y in range(60, 630, 44))}</g>
<rect x="0" y="606" width="1200" height="24" fill="{RED}"/>
{mark(96, 120, 2.2, board='#FFFFFF', clip=RED, check=TEAL, hole='#FFFFFF')}
<g transform="translate(270 228)">{wm5}</g>
<g transform="translate(100 400)"><path d="{t1}" fill="#FFFFFF"/></g>
<g transform="translate(100 452)"><path d="{t2}" fill="#CFE7E3"/></g>'''
files['og-image.svg'] = svg(1200, 630, og, 'Ceklis SD')

for k, v in files.items():
    open(f'{OUT}/{k}', 'w').write(v)
print('\n'.join(files))
