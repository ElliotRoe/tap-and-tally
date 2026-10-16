"""Builds src/lib/art/svg/roman.svg, the Mediterranean footer of the hidden Roman theme:
desert.svg's twin, with olive hills, a temple at sunset, cypresses and an olive tree.
Run: python3 scripts/roman-art.py src/lib/art/svg/roman.svg"""
import math
import sys

from print_texture import Print

OUT = sys.argv[1]
W, H = 1600, 300
P = Print("roman", (0, 0, W, H))
MARBLE, MARBLE_SHADE = "#ece2cc", "#c4b597"

# The corner: a sun rising beside a temple on its own hill, bottom right; drawn first so
# even the furthest hill passes in front of it.
SUN_X, SUN_Y, SUN_R = 1490, 172, 36
rays = []
for degrees in (-165, -128, -90, -52, -15):
    a = math.radians(degrees)
    near, far = SUN_R + 10, SUN_R + 22
    rays.append(f"M{SUN_X + near * math.cos(a):.0f} {SUN_Y + near * math.sin(a):.0f}L{SUN_X + far * math.cos(a):.0f} {SUN_Y + far * math.sin(a):.0f}")
P.raw(f'<g stroke="#d9a53a" stroke-width="7" stroke-linecap="round"><path d="{"".join(rays)}"/></g>')
P.shape("sun", f'cx="{SUN_X}" cy="{SUN_Y}" r="{SUN_R}"', "#ecc25a", [
    ("speck", "#fbefc8", P.down(SUN_Y - SUN_R, SUN_Y + SUN_R, 0, 1)),
    ("coarse", "#d9a53a", P.across(SUN_X - SUN_R, SUN_X + SUN_R, 0, .45)),
], kind="circle")
# The far hills: the palest band, rolling the whole width; a fine stipple settles into the dips.
P.shape("far", "M0 196C120 170 240 168 360 182s250 26 380 8 260-38 400-30 220 34 340 26 100-4 120-2V300H0z", "#e9e6cf", [
    ("fine", "#cdc8a2", P.down(170, 250, 0, .55)),
])

P.shape("rise", "M1140 254C1220 236 1270 224 1296 223H1504C1534 224 1570 230 1600 234V262H1140z", "#dcd9b4", [
    ("fine", "#bdb88c", P.down(222, 254, .1, .6)),
])

# The temple: three steps, six evenly spaced columns, a beam and a low pediment,
# all symmetric about its centre. Each column is shaded on its right.
CX = 1400
marble_grain = lambda top, bottom: ("fine", MARBLE_SHADE, P.down(top, bottom, .1, .5))  # noqa: E731
for i, (half, y0, y1) in enumerate([(100, 216, 224), (93, 208, 216), (86, 200, 208)]):
    x0, x1 = CX - half, CX + half
    P.shape(f"step{i}", f"M{x0} {y0}H{x1}V{y1}H{x0}z", MARBLE, [marble_grain(y0, y1)])
    P.raw(f'<path d="M{x0} {y1 - 3}H{x1}V{y1}H{x0}z" fill="{MARBLE_SHADE}"/>')
# The shaded inner wall and doorway behind the columns, so the columns stand out against it.
P.shape("cella", f"M{CX - 80} 156H{CX + 80}V200H{CX - 80}z", "#bfae8b", [("fine", "#a89672", P.down(156, 200, .5, .2))])
P.raw(f'<path d="M{CX - 9} 170H{CX + 9}V200H{CX - 9}z" fill="#a39270"/>')
for i in range(6):
    cx = CX - 75 + i * 30
    P.shape(f"col{i}", f"M{cx - 6} 160H{cx + 6}V200H{cx - 6}z", MARBLE, [marble_grain(160, 200)])
    P.raw(f'<path d="M{cx + 1} 160H{cx + 6}V200H{cx + 1}z" fill="#dcd0b6"/>')  # lighter than the wall behind
    P.raw(f'<path d="M{cx - 9} 156H{cx + 9}V161H{cx - 9}z" fill="{MARBLE}"/>')  # capital
    P.raw(f'<path d="M{cx - 8} 196H{cx + 8}V200H{cx - 8}z" fill="{MARBLE}"/>')  # base
P.shape("beam", f"M{CX - 90} 145H{CX + 90}V156H{CX - 90}z", MARBLE, [marble_grain(145, 156)])
P.raw(f'<path d="M{CX - 90} 151H{CX + 90}V156H{CX - 90}z" fill="{MARBLE_SHADE}"/>')
P.raw(f'<path d="M{CX - 95} 145H{CX + 95}V148H{CX - 95}z" fill="#c4b89f"/>')  # the cornice's shadow
P.shape("roof", f"M{CX - 97} 146L{CX} 120 {CX + 97} 146z", MARBLE, [marble_grain(120, 146)])
P.shape("tympanum", f"M{CX - 78} 143L{CX} 127 {CX + 78} 143z", MARBLE_SHADE, [("fine", "#c4b89f", P.down(127, 143, .2, .6))])

# The middle hills, in front of the far ones; they dip below the temple's steps.
P.shape("mid", "M0 236C110 214 220 206 340 214s210 22 330 14 230-34 360-30C1140 196 1220 214 1280 238S1500 252 1600 250V300H0z", "#dcd9b4", [
    ("fine", "#bdb88c", P.down(206, 280, 0, .7)),
    ("coarse", "#c9c59c", P.across(700, 1600, 0, .4)),
])

# Two cypresses and an olive tree scattered across the middle hills.
P.cypress("c1", 160, 220, 11, 48, "#66804f", "#7d9663", "#4d6644", "#94aa78")
P.cypress("c2", 175, 218, 9, 36, "#66804f", "#7d9663", "#4d6644", "#94aa78")
P.olive("o1", 612, 228, 40)
P.cypress("c3", 1040, 201, 11, 50, "#66804f", "#7d9663", "#4d6644", "#94aa78")

# The near hills: the warmest band, swelling in the middle so the credit sits wholly on it;
# coarse grain gathers at the foot.
P.shape("near", "M0 266C160 250 330 244 500 242S800 232 960 236S1260 246 1380 240S1550 240 1600 238V300H0z", "#cfcb9e", [
    ("coarse", "#aaa577", P.fade(0, 236, 0, 300, [(0, 0), (.5, .2), (1, .6)])),
    ("fine", "#b3ae80", P.down(240, 300, 0, .55)),
    ("speck", "#ebe8d2", P.down(234, 254, .8, 0)),
])

# The big cypress, standing in the corner in front of the temple.
P.cypress("big", 1250, 264, 26, 140)

# A couple of stones.
P.raw('<g fill="#b5b083"><ellipse cx="380" cy="270" rx="9" ry="5"/><ellipse cx="394" cy="273" rx="5" ry="3"/><ellipse cx="1330" cy="282" rx="7" ry="4"/></g>')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 86 1600 214" preserveAspectRatio="xMaxYMax slice">
  <!--
    Flat shapes printed like a two-ink poster: each layer gets its own texture, faded in
    and out so the texture is heaviest where the shape is in shadow. Generated by
    scripts/roman-art.py: edit that, not this file.
  -->
  <defs>
{P.defs()}
  </defs>
  {P.body()}
</svg>
'''
open(OUT, "w").write(svg)
