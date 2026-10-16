"""Printed texture for the illustrations: flat shapes, then a texture per layer
(stipple, mottling, rock strata, cactus ribs, paper flecks), faded in and out by a
gradient so the texture is heaviest where the shape is in shadow.

Used by desert-art.py and hill-art.py so every drawing is printed the same way."""

# feTurbulence settings for each texture, then how hard to threshold the noise into specks.
PATTERNS = {
    "fine": dict(freq=".95", octaves=2, seed=3, slope=-2.4, offset=1.02),  # tight stipple
    "coarse": dict(freq=".22", octaves=4, seed=8, slope=-3.4, offset=1.42),  # blotchy mottling
    "strata": dict(freq=".012 .32", octaves=3, seed=5, slope=-3.2, offset=1.6),  # horizontal rock bands
    "rib": dict(freq=".55 .018", octaves=2, seed=11, slope=-3.0, offset=1.5),  # vertical cactus ribs
    "speck": dict(freq="1.3", octaves=1, seed=21, slope=-3.4, offset=1.45),  # sparse light flecks
}


class Print:
    """Collects the shapes, textures, clips and masks of one drawing. Every id starts
    with `prefix`, so two drawings on one page never share a filter by accident."""

    def __init__(self, prefix, box):
        self.prefix = prefix
        self.box = box
        self.filters, self.clips, self.masks, self.layers = {}, [], [], []
        self.count = 0

    def texture(self, pattern, color):
        key = f"{self.prefix}-tex-{pattern}-{color.strip('#')}"
        if key not in self.filters:
            p = PATTERNS[pattern]
            self.filters[key] = f'''    <filter id="{key}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="{p['freq']}" numOctaves="{p['octaves']}" seed="{p['seed']}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 {p['slope']} {p['offset']}" result="alpha"/>
      <feComponentTransfer in="alpha" result="specks"><feFuncA type="discrete" tableValues="0 .55 .85 1"/></feComponentTransfer>
      <feFlood flood-color="{color}" result="ink"/>
      <feComposite in="ink" in2="specks" operator="in"/>
    </filter>'''
        return key

    def fade(self, x1, y1, x2, y2, stops):
        """A mask fading from one point to another: stops are (offset, strength 0..1)."""
        self.count += 1
        mid = f"{self.prefix}-fade-{self.count}"
        st = "".join(f'<stop offset="{o}" stop-color="#fff" stop-opacity="{a}"/>' for o, a in stops)
        bx, by, bw, bh = self.box
        self.masks.append(
            f'''    <linearGradient id="{mid}-g" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>
    <mask id="{mid}" maskUnits="userSpaceOnUse" x="{bx}" y="{by}" width="{bw}" height="{bh}"><rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#{mid}-g)"/></mask>'''
        )
        return mid

    def down(self, top, bottom, a0, a1):
        return self.fade(0, top, 0, bottom, [(0, a0), (1, a1)])

    def across(self, left, right, a0, a1):
        return self.fade(left, 0, right, 0, [(0, a0), (1, a1)])

    def raw(self, markup):
        self.layers.append(markup)

    def shape(self, name, d, fill, textures=(), kind="path"):
        """A flat shape, then each texture clipped to it and faded by its own mask."""
        el = f"<{kind} {d}/>" if kind != "path" else f'<path d="{d}"/>'
        self.layers.append(el.replace("/>", f' fill="{fill}"/>', 1))
        if not textures:
            return
        clip = f"{self.prefix}-clip-{name}"
        self.clips.append(f'    <clipPath id="{clip}">{el}</clipPath>')
        bx, by, bw, bh = self.box
        for pattern, color, mask in textures:
            f = self.texture(pattern, color)
            self.layers.append(
                f'<g clip-path="url(#{clip})" mask="url(#{mask})"><rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#000" filter="url(#{f})"/></g>'
            )

    def saguaro(self, name, x, y, trunk_w, trunk_h, arms, arm_w, dark="#6a8455", light="#86a06d", rib="#4a6139"):
        """A saguaro: arms bent up, the trunk's left half lit; ribbing darkens the shaded half."""
        half = trunk_w / 2
        arm_paths = "".join(f'<path d="{a}"/>' for a in arms)
        self.raw(
            f'<g transform="translate({x} {y})" fill="none" stroke="{dark}" stroke-width="{arm_w}" stroke-linecap="round" stroke-linejoin="round">{arm_paths}</g>'
        )
        trunk = f'x="{x - half}" y="{y - trunk_h}" width="{trunk_w}" height="{trunk_h + 2}" rx="{half}"'
        self.shape(f"{name}-trunk", trunk, dark, [("rib", rib, self.across(x - half, x + half, .1, .9))], kind="rect")
        lit = f"M{x} {y - trunk_h}a{half} {half} 0 0 0-{half} {half}v{trunk_h - half + 2}h{half}z"
        self.shape(f"{name}-lit", lit, light, [("rib", "#a6bc90", self.down(y - trunk_h, y, .8, .1))])

    def cypress(self, name, x, y, w, h, dark="#4d6644", light="#66804f", rib="#3b5235", rib_light="#809a66", trunk="#6e5a44"):
        """An Italian cypress standing on (x, y): a tall narrow spindle, widest low down,
        on a stub of trunk; the left half lit, a vertical grain over both halves."""
        r = lambda v: round(v, 1)  # noqa: E731
        stub = max(3, round(w * .16))
        foot = y - max(4, round(h * .06))  # where the foliage ends and the trunk shows
        top, hw, fh = y - h, w / 2, foot - (y - h)
        self.raw(f'<rect x="{r(x - stub / 2)}" y="{r(foot - 3)}" width="{stub}" height="{r(y - foot + 3)}" fill="{trunk}"/>')

        def side(s):  # one side from the tip down to the foot; s = 1 right, -1 left
            return (f"C{r(x + s * hw * .45)} {r(top + fh * .12)} {r(x + s * hw)} {r(top + fh * .3)} {r(x + s * hw)} {r(top + fh * .58)}"
                    f"C{r(x + s * hw)} {r(top + fh * .86)} {r(x + s * hw * .7)} {r(foot)} {x} {r(foot)}")

        left_up = (f"C{r(x - hw * .7)} {r(foot)} {r(x - hw)} {r(top + fh * .86)} {r(x - hw)} {r(top + fh * .58)}"
                   f"C{r(x - hw)} {r(top + fh * .3)} {r(x - hw * .45)} {r(top + fh * .12)} {x} {top}")
        self.shape(f"{name}-tree", f"M{x} {top}{side(1)}{left_up}z", dark, [("rib", rib, self.across(x - hw, x + hw, .2, .9))])
        self.shape(f"{name}-lit", f"M{x} {top}{side(-1)}z", light, [("rib", rib_light, self.down(top, foot, .9, .3))])

    def olive(self, name, x, y, w, canopy="#8f9a6e", ink="#6f7a52", lit="#c9cfae", trunk="#7a6650"):
        """An olive tree on (x, y): a short twisted trunk under a lumpy grey-green crown."""
        u = w / 40  # the crown is drawn 40 units wide, then scaled
        r = lambda v: round(v, 1)  # noqa: E731
        self.raw(
            f'<path d="M{r(x - 2 * u)} {y}c{r(1 * u)} {r(-5 * u)} {r(-3 * u)} {r(-8 * u)} {r(-1 * u)} {r(-14 * u)}M{r(x - 3 * u)} {r(y - 9 * u)}'
            f'c{r(3 * u)} {r(-2 * u)} {r(6 * u)} {r(-3 * u)} {r(8 * u)} {r(-7 * u)}" fill="none" stroke="{trunk}" stroke-width="{r(3.4 * u)}" stroke-linecap="round"/>'
        )
        cy = y - 22 * u
        blobs = [(-11, 2, 10), (0, -4, 12), (11, 1, 10), (2, 5, 10)]
        d = "".join(
            f"M{r(x + (bx - br) * u)} {r(cy + by * u)}a{r(br * u)} {r(br * u)} 0 1 0 {r(2 * br * u)} 0a{r(br * u)} {r(br * u)} 0 1 0 {r(-2 * br * u)} 0z"
            for bx, by, br in blobs
        )
        self.shape(f"{name}-crown", d, canopy, [
            ("fine", ink, self.down(cy - 16 * u, cy + 15 * u, 0, .9)),
            ("speck", lit, self.down(cy - 16 * u, cy + 4 * u, .9, 0)),
        ])

    def defs(self):
        return "\n".join([*self.filters.values(), *self.clips, *self.masks])

    def body(self, indent="  "):
        return ("\n" + indent).join(self.layers)
