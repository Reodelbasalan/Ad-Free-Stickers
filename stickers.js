/* Free Stickers — every sticker is drawn here as SVG code.
   Same file is used by the web editor (index.html) and by build/build.js (makes the SVG/PNG files).
   Each sticker: { id, cat, name, tags, c1, c2, text?, text2?, border?, draw(o) -> svg inner markup }
   o = { c1, c2, text, text2 } (user-editable) */
(function (root) {
"use strict";

const FONT = "'Arial Black','Arial Rounded MT Bold','Segoe UI Black','Helvetica Neue',Impact,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const INK = "#1b1b1f";
let FLIP = false;   // set by render(): flipped stickers keep their text readable

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const n2 = v => Math.round(v * 10) / 10;

function txt(t, o = {}) {
  const { x = 256, y = 256, size = 96, maxW = 400, fill = "#fff", stroke = INK, sw = 0, rot = 0,
          family = FONT, anchor = "middle", weight = 900, italic = false, ls = 0 } = o;
  t = String(t ?? "");
  const est = t.length * size * (o.wf || 0.74) + Math.max(0, t.length - 1) * ls;
  const fit = est > maxW ? ` textLength="${maxW}" lengthAdjust="spacingAndGlyphs"` : "";
  const st = sw ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke"` : "";
  const tr = (rot || FLIP) ? ` transform="${FLIP ? `translate(${2 * x} 0) scale(-1 1) ` : ""}${rot ? `rotate(${rot} ${x} ${y})` : ""}"` : "";
  return `<text x="${x}" y="${y}" font-family="${esc(family)}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${ls}" text-anchor="${anchor}" dominant-baseline="central" fill="${fill}"${st}${fit}${tr}>${esc(t)}</text>`;
}
/* text that shrinks its font size for long words, so it always fits nicely */
function fitTxt(t, o = {}) {
  t = String(t ?? "");
  // CAPS are wide, lowercase is narrower (serif even more): estimate width per character
  const lower = (t.match(/[a-z .,']/g) || []).length / Math.max(1, t.length);
  const wf = o.wf || (0.74 - lower * (o.family === SERIF ? 0.28 : 0.18));
  const size = Math.max(28, Math.min(o.size || 110, (o.maxW || 380) / (Math.max(1, t.length) * wf)));
  return txt(t, { ...o, size: n2(size), wf });
}
function pts(cx, cy, R, r, n, rot = -90, jitter = null) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    let rad = i % 2 ? r : R;
    if (jitter) rad *= 1 + (jitter() - 0.5) * 0.28;
    const a = (rot + i * 180 / n) * Math.PI / 180;
    out.push(n2(cx + Math.cos(a) * rad) + "," + n2(cy + Math.sin(a) * rad));
  }
  return out.join(" ");
}
const poly = (p, fill, extra = "") => `<polygon points="${p}" fill="${fill}" ${extra}/>`;
const rr = (x, y, w, h, r, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circ = (cx, cy, r, fill, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color, w, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
function rng(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const sparkle = (cx, cy, R) => `M${cx} ${cy - R}Q${cx} ${cy} ${cx + R} ${cy}Q${cx} ${cy} ${cx} ${cy + R}Q${cx} ${cy} ${cx - R} ${cy}Q${cx} ${cy} ${cx} ${cy - R}Z`;
const HEART = "M256 452C118 346 40 268 40 172C40 100 96 52 160 52C204 52 238 76 256 112C274 76 308 52 352 52C416 52 472 100 472 172C472 268 394 346 256 452Z";
const heartAt = (cx, cy, s, fill) => path(HEART, fill, `transform="translate(${cx - 256 * s} ${cy - 252 * s}) scale(${s})"`);
const DROP = "M0 -46C18 -18 30 -2 30 16A30 30 0 0 1 -30 16C-30 -2 -18 -18 0 -46Z";
const drop = (x, y, s = 1, fill = "#4fc3ff") => path(DROP, fill, `transform="translate(${x} ${y}) scale(${s})"`);
const shade = (hex, amt) => {               // darken (amt<0) or lighten (amt>0) a #rrggbb color
  const h = hex.replace("#", ""); if (h.length !== 6) return hex;
  const c = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)).map(v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return "#" + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
};
const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
const rgrad = (id, a, b) => `<defs><radialGradient id="${id}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;

/* ---------- reusable shapes ---------- */
const BG = {
  burst:  (c, id) => poly(pts(256, 256, 236, 178, 16, -90, rng(id.length * 31)), c),
  boom:   (c, id) => poly(pts(256, 256, 240, 150, 11, -80, rng(id.length * 7 + 3)), c),
  star:   c => poly(pts(256, 266, 240, 118, 5), c, 'stroke="' + c + '" stroke-width="24" stroke-linejoin="round"'),
  seal:   c => poly(pts(256, 256, 226, 202, 22), c),
  circle: c => circ(256, 256, 214, c),
  pill:   c => rr(30, 166, 452, 180, 90, c),
  tilt:   c => rr(44, 156, 424, 200, 36, c, 'transform="rotate(-7 256 256)"'),
  cloud:  c => [circ(150, 270, 100, c), circ(250, 210, 120, c), circ(360, 260, 105, c), rr(110, 250, 300, 110, 55, c)].join(""),
  wave:   c => path("M40 200Q100 160 160 200T280 200T400 200T472 200L472 320Q412 360 352 320T232 320T112 320T40 320Z", c, 'stroke="' + c + '" stroke-width="20" stroke-linejoin="round"'),
};
function ribbon(c1, c2, y = 256, h = 120) {
  const t = y - h / 2, b = y + h / 2, d = shade(c1, -0.35);
  return [
    poly(`28,${t + 30} 120,${t + 30} 120,${b + 30} 28,${b + 30} 62,${y + 30}`, c2),
    poly(`484,${t + 30} 392,${t + 30} 392,${b + 30} 484,${b + 30} 450,${y + 30}`, c2),
    poly(`92,${b} 120,${b + 30} 120,${b}`, d), poly(`420,${b} 392,${b + 30} 392,${b}`, d),
    rr(92, t, 328, h, 8, c1),
  ].join("");
}
const playIcon = (cx, cy, s, fill) => poly(`${cx - s * .45},${cy - s * .55} ${cx + s * .6},${cy} ${cx - s * .45},${cy + s * .55}`, fill, `stroke="${fill}" stroke-width="${s * .18}" stroke-linejoin="round"`);
const THUMB = "M172 236L244 236L270 124Q280 78 318 84Q352 92 344 148L332 214L414 214Q450 216 448 254Q446 276 428 284Q450 296 446 326Q442 346 424 352Q442 366 434 392Q428 410 408 414Q422 432 410 448Q400 462 376 462L196 462Q172 462 172 438Z";

/* ---------- faces ---------- */
const FACE_IN = "#3a2410";
function face(o, id, features) {
  return rgrad("fg" + id, shade(o.c1, 0.35), shade(o.c1, -0.12)) + circ(256, 256, 216, `url(#fg${id})`) + features;
}

/* ---------- the stickers ---------- */
const L = [];
const add = (cat, id, name, tags, c1, c2, draw, extra = {}) => L.push({ cat, id, name, tags, c1, c2, draw, ...extra });

/* SOCIAL ----------------------------------------------------- */
add("social", "subscribe", "Subscribe", "youtube button", "#ff0033", "#ffffff", o =>
  rr(24, 180, 464, 152, 34, o.c1) + rr(52, 206, 100, 100, 26, o.c2) + playIcon(104, 256, 44, o.c1) +
  fitTxt(o.text, { x: 316, y: 258, size: 62, maxW: 300, fill: o.c2 }), { text: "SUBSCRIBE" });
add("social", "subscribed", "Subscribed", "youtube done check", "#3d3d46", "#ffffff", o =>
  rr(24, 180, 464, 152, 34, o.c1) + line("M70 258L104 292L160 220", o.c2, 26) +
  fitTxt(o.text, { x: 318, y: 258, size: 58, maxW: 300, fill: o.c2 }), { text: "SUBSCRIBED" });
add("social", "like", "Like", "thumbs up facebook", "#1877f2", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + rr(96, 236, 66, 226, 12, o.c2, 'transform="translate(10 -30) scale(.95)"') +
  path(THUMB, o.c2, 'transform="translate(10 -30) scale(.95)"'));
add("social", "dislike", "Dislike", "thumbs down", "#5b6170", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + `<g transform="rotate(180 256 256)">${rr(96, 236, 66, 226, 12, o.c2, 'transform="translate(10 -30) scale(.95)"')}${path(THUMB, o.c2, 'transform="translate(10 -30) scale(.95)"')}</g>`);
add("social", "follow", "Follow", "tiktok instagram plus", "#ff2d55", "#ffffff", o =>
  rr(24, 180, 464, 152, 76, o.c1) + line("M76 256H140M108 224V288", o.c2, 22) +
  fitTxt(o.text, { x: 320, y: 258, size: 66, maxW: 256, fill: o.c2 }), { text: "FOLLOW" });
add("social", "bell", "Notification bell", "notify alert", "#ffc400", "#ff2d2d", o =>
  circ(256, 262, 210, o.c1) +
  path("M256 120C318 120 344 170 344 226L344 290L380 334L132 334L168 290L168 226C168 170 194 120 256 120Z", "#fff") +
  circ(256, 354, 28, "#fff") + circ(256, 116, 16, "#fff") + circ(372, 142, 50, o.c2) + txt("1", { x: 372, y: 145, size: 60, fill: "#fff" }));
add("social", "share", "Share", "send forward", "#00b894", "#ffffff", o =>
  rr(24, 180, 464, 152, 76, o.c1) +
  path("M62 296Q72 222 140 214L140 186L188 236L140 286L140 256Q96 256 62 296Z", o.c2, `stroke="${o.c2}" stroke-width="10" stroke-linejoin="round"`) +
  fitTxt(o.text, { x: 336, y: 258, size: 70, maxW: 236, fill: o.c2 }), { text: "SHARE" });
add("social", "comment", "Comment", "chat message dots", "#00c2a8", "#ffffff", o =>
  path("M256 72C374 72 464 146 464 238C464 330 374 404 256 404C230 404 206 400 184 394L96 448L118 368C74 336 48 290 48 238C48 146 138 72 256 72Z", o.c1) +
  circ(166, 240, 30, o.c2) + circ(256, 240, 30, o.c2) + circ(346, 240, 30, o.c2));
add("social", "linkinbio", "Link in bio", "url profile", "#7b2ff7", "#ffffff", o =>
  grad("lb", shade(o.c1, .25), o.c1) + rr(24, 170, 464, 172, 44, "url(#lb)") +
  fitTxt(o.text, { y: 238, size: 70, maxW: 400, fill: o.c2 }) + line("M226 300L256 324L286 300", o.c2, 16), { text: "LINK IN BIO" });
add("social", "swipeup", "Swipe up", "chevron arrow", "#ffffff", "#ff2d55", o =>
  line("M176 150L256 80L336 150", INK, 56) + line("M176 150L256 80L336 150", o.c1, 34) +
  line("M176 230L256 160L336 230", INK, 56) + line("M176 230L256 160L336 230", o.c1, 34) +
  rr(40, 290, 432, 130, 65, o.c2) + fitTxt(o.text, { y: 357, size: 70, maxW: 360, fill: "#fff" }), { text: "SWIPE UP" });
add("social", "newvideo", "New video", "upload play", "#ff0033", "#ffffff", o =>
  rr(36, 110, 440, 292, 60, o.c1) + playIcon(256, 214, 110, o.c2) + fitTxt(o.text, { y: 346, size: 58, maxW: 380, fill: o.c2 }), { text: "NEW VIDEO" });
add("social", "heartlike", "Heart like", "love react", "#ff3b5c", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + heartAt(256, 262, .62, o.c2));

/* REACTIONS (editable text) ---------------------------------- */
const react = (id, text, shape, c1, c2, rot = -6, tags = "") =>
  add("reactions", id, text.replace(/!$/, "") + (text.endsWith("!") ? "!" : ""), "text reaction " + tags, c1, c2, o =>
    BG[shape](o.c1, id) + fitTxt(o.text, { y: shape === "star" ? 280 : 260, size: shape === "star" ? 92 : 124, maxW: shape === "star" ? 250 : 360, fill: o.c2, sw: 22, rot }),
    { text });
react("wow", "WOW!", "burst", "#ffd60a", "#ff2d55", -8, "amazed");
react("omg", "OMG", "burst", "#ff6fb5", "#ffffff", -6, "shock");
react("lol", "LOL", "tilt", "#00d1ff", "#ffffff", -7, "funny laugh");
react("grabe", "GRABE!", "boom", "#ff8a00", "#ffffff", -5, "tagalog filipino");
react("sanaall", "SANA ALL", "cloud", "#b26bff", "#ffffff", -4, "tagalog filipino");
react("lodi", "LODI", "star", "#ffc400", "#ffffff", -4, "idol filipino");
react("petmalu", "PETMALU", "burst", "#ff3b30", "#ffe600", -6, "malupit filipino");
react("char", "CHAR!", "tilt", "#ff4fa3", "#ffffff", 5, "joke filipino");
react("ayos", "AYOS!", "circle", "#2ecc71", "#ffffff", -8, "nice ok filipino");
react("yay", "YAY!", "burst", "#c6ff00", "#7b2ff7", -8, "happy");
react("hahaha", "HAHAHA", "wave", "#ffe600", "#ff6a00", -3, "laugh funny");
react("sheesh", "SHEESH", "pill", "#7fdbff", "#ffffff", -5, "wow");
react("nooo", "NOOO!", "boom", "#9aa0ad", "#ffffff", 6, "sad shout");
react("legit", "LEGIT", "seal", "#00b894", "#ffffff", -8, "real check");
react("boom", "BOOM!", "boom", "#ff4500", "#ffe600", -8, "explosion");
react("slay", "SLAY", "pill", "#ff2d95", "#ffffff", -6, "queen");
react("gg", "GG", "circle", "#1e1e28", "#00ff9c", -8, "gaming good game");
react("pak", "PAK!", "burst", "#00e5ff", "#ff0066", -10, "ganern filipino");
react("kilig", "KILIG", "cloud", "#ff8fc7", "#ffffff", -5, "love filipino");
react("panalo", "PANALO!", "seal", "#ffb300", "#ffffff", -6, "win filipino");

/* SPEECH BUBBLES -------------------------------------------- */
const bubble = (id, name, outline, fillShapes, text, ty = 230, size = 78) =>
  add("bubbles", id, name, "speech talk chat comic", "#ffffff", INK, o =>
    `<g stroke="${o.c2}" stroke-width="22" stroke-linejoin="round">${outline(o.c1)}</g>` + fillShapes(o.c1) +
    fitTxt(o.text, { y: ty, size, maxW: 300, fill: o.c2 }), { text });
const SP_E = c => `<ellipse cx="256" cy="230" rx="216" ry="160" fill="${c}"/>`, SP_T = c => poly("150,330 110,460 250,370", c);
bubble("speech", "Speech bubble", c => SP_E(c) + SP_T(c), c => SP_E(c) + SP_T(c), "Hello!");
const CH_R = c => rr(40, 80, 432, 280, 50, c), CH_T = c => poly("340,340 420,456 260,350", c);
bubble("chat", "Chat bubble", c => CH_R(c) + CH_T(c), c => CH_R(c) + CH_T(c), "Totoo ba?", 220, 72);
const TH = c => BG.cloud(c) + circ(120, 420, 30, c) + circ(70, 470, 18, c);
bubble("thought", "Thought bubble", TH, TH, "Hmm...", 252, 80);
const SH = c => poly(pts(256, 240, 240, 168, 14, -90, rng(99)), c);
bubble("shout", "Shout bubble", SH, SH, "AAAH!", 240, 96);
add("bubbles", "whisper", "Whisper bubble", "speech quiet dashed", "#ffffff", INK, o =>
  `<ellipse cx="256" cy="230" rx="216" ry="160" fill="${o.c1}" stroke="${o.c2}" stroke-width="12" stroke-dasharray="26 18"/>` +
  poly("150,350 120,450 220,382", o.c1, `stroke="${o.c2}" stroke-width="12" stroke-dasharray="26 18" stroke-linejoin="round"`) +
  fitTxt(o.text, { y: 230, size: 76, maxW: 300, fill: o.c2, weight: 700, italic: true }), { text: "psst..." });
add("bubbles", "comicbox", "Comic caption box", "narration caption", "#ffe45c", INK, o =>
  rr(36, 150, 440, 212, 4, o.c1, `stroke="${o.c2}" stroke-width="16" transform="rotate(-2 256 256)"`) +
  fitTxt(o.text, { y: 256, size: 64, maxW: 380, fill: o.c2, rot: -2 }), { text: "MEANWHILE..." });

/* ARROWS ----------------------------------------------------- */
add("arrows", "arrow", "Arrow", "right point", "#ff2d55", INK, o =>
  poly("40,206 300,206 300,110 472,256 300,402 300,306 40,306", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`));
add("arrows", "curvedarrow", "Curved arrow", "bend point", "#ffd000", INK, o =>
  line("M70 400Q90 140 360 150", o.c1, 56) + poly("330,64 470,150 330,236", o.c1, `stroke="${o.c1}" stroke-width="24" stroke-linejoin="round"`));
add("arrows", "handarrow", "Hand-drawn arrow", "sketch doodle point", "#ff3b30", INK, o =>
  line("M60 420C120 300 60 240 180 220C300 200 240 340 330 300C390 270 380 180 430 110", o.c1, 26) +
  line("M368 120L432 104L446 170", o.c1, 26));
add("arrows", "doublearrow", "Double arrow", "left right both", "#00c2ff", INK, o =>
  poly("40,256 160,140 160,210 352,210 352,140 472,256 352,372 352,302 160,302 160,372", o.c1, `stroke="${o.c1}" stroke-width="18" stroke-linejoin="round"`));
add("arrows", "downarrow", "Down arrow", "below look", "#7c4dff", INK, o =>
  poly("190,40 322,40 322,250 440,250 256,472 72,250 190,250", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`));
add("arrows", "circlehighlight", "Circle highlight", "mark scribble focus", "#ff2d2d", INK, o =>
  line("M110 160C190 80 420 90 450 220C480 360 260 430 140 380C40 340 40 220 120 150C150 124 200 108 240 104", o.c1, 20));
add("arrows", "lookarrow", "Look! arrow", "point text", "#ffd000", INK, o =>
  poly("40,206 300,206 300,110 472,256 300,402 300,306 40,306", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`) +
  fitTxt(o.text, { x: 200, y: 258, size: 70, maxW: 240, fill: o.c2 }), { text: "LOOK!" });
add("arrows", "zigzag", "Zigzag arrow", "sketch", "#00e676", INK, o =>
  line("M60 400L160 300L220 360L330 220", o.c1, 34) + poly("300,150 440,110 400,250", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`));
add("arrows", "underline", "Underline scribble", "highlight mark", "#ff3b30", INK, o =>
  line("M40 240C140 200 300 210 470 220M70 300C180 270 320 270 440 290", o.c1, 26));

/* SHAPES & DECOR -------------------------------------------- */
add("shapes", "star", "Star", "rating gold", "#ffc400", "#ff9800", o =>
  grad("st", shade(o.c1, .25), o.c2) + poly(pts(256, 270, 236, 112, 5), "url(#st)", `stroke="url(#st)" stroke-width="28" stroke-linejoin="round"`) +
  path("M180 210Q200 180 230 175", "none", 'stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".7"'));
add("shapes", "heart", "Heart", "love", "#ff2d55", "#ff8fab", o =>
  grad("hg", o.c2, o.c1) + path(HEART, "url(#hg)") + path("M120 150Q130 110 170 104", "none", 'stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".7"'));
add("shapes", "sparkle", "Sparkle", "shine star twinkle", "#ffe14d", "#ffffff", o =>
  path(sparkle(230, 270, 200), o.c1) + path(sparkle(390, 120, 70), o.c1) + path(sparkle(230, 270, 70), o.c2, 'opacity=".75"'));
add("shapes", "sparkles", "Sparkles", "shine magic", "#b388ff", "#ffffff", o =>
  path(sparkle(180, 300, 150), o.c1) + path(sparkle(370, 150, 100), shade(o.c1, .3)) + path(sparkle(390, 380, 60), o.c1) + circ(120, 110, 22, o.c2));
add("shapes", "lightning", "Lightning", "flash bolt power", "#ffe600", "#ff9100", o =>
  grad("lg", o.c1, o.c2) + poly("300,36 110,290 236,290 196,476 404,196 276,196 340,36", "url(#lg)", `stroke="url(#lg)" stroke-width="14" stroke-linejoin="round"`));
add("shapes", "fire", "Fire", "hot lit flame", "#ff5a1f", "#ffd23f", o =>
  path("M256 36C300 128 404 170 394 300C386 404 322 474 256 474C178 474 116 412 118 320C120 250 168 208 178 146C214 188 220 228 230 250C252 178 240 110 256 36Z", o.c1) +
  path("M256 228C292 290 342 322 332 384C324 434 292 460 256 460C214 460 182 428 186 382C188 340 224 320 256 228Z", o.c2));
add("shapes", "crown", "Crown", "king queen winner", "#ffc400", "#ff2d55", o =>
  poly("84,376 56,150 172,252 256,96 340,252 456,150 428,376", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`) +
  rr(80, 372, 352, 64, 14, shade(o.c1, -0.18)) + circ(256, 404, 20, o.c2) + circ(170, 404, 16, "#29b6f6") + circ(342, 404, 16, "#29b6f6") +
  circ(56, 150, 24, o.c1) + circ(256, 92, 26, o.c1) + circ(456, 150, 24, o.c1));
add("shapes", "music", "Music notes", "song sound audio", "#7c4dff", "#ff4fa3", o =>
  poly("190,130 430,70 430,130 190,190", o.c1) + rr(176, 130, 30, 270, 10, o.c1) + rr(416, 74, 30, 270, 10, o.c1) +
  `<ellipse cx="150" cy="400" rx="64" ry="50" fill="${o.c1}" transform="rotate(-20 150 400)"/><ellipse cx="390" cy="344" rx="64" ry="50" fill="${o.c1}" transform="rotate(-20 390 344)"/>` +
  path(sparkle(80, 120, 44), o.c2));
add("shapes", "check", "Check", "correct yes tama", "#2ecc71", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + line("M146 262L224 338L370 180", o.c2, 52));
add("shapes", "cross", "Wrong X", "mali no", "#ff3b30", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + line("M166 166L346 346M346 166L166 346", o.c2, 52));
add("shapes", "question", "Question mark", "what huh", "#00b0ff", "#ffffff", o =>
  circ(256, 256, 216, o.c1) + txt("?", { y: 270, size: 300, fill: o.c2 }));
add("shapes", "exclaim", "Exclamation", "alert important", "#ff9100", "#ffffff", o =>
  poly(pts(256, 256, 236, 196, 18), o.c1) + txt("!", { y: 266, size: 300, fill: o.c2 }));
add("shapes", "hundred", "100", "perfect score", "#ff1744", INK, o =>
  txt(o.text, { y: 230, size: 210, maxW: 430, fill: o.c1, italic: true, rot: -8 }) +
  line("M70 360Q250 330 440 340", o.c1, 22) + line("M90 410Q260 384 420 394", o.c1, 22), { text: "100", border: true });
add("shapes", "rainbow", "Rainbow", "happy colors", "#ff3b30", "#ffffff", o =>
  ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de"].map((c, i) => line(`M${56 + i * 30} 380A${200 - i * 30} ${200 - i * 30} 0 0 1 ${456 - i * 30} 380`, i ? c : o.c1, 32)).join("") +
  [[96, 384], [376, 384]].map(([x, y]) => circ(x - 30, y + 10, 46, o.c2) + circ(x + 10, y - 22, 56, o.c2) + circ(x + 56, y + 10, 46, o.c2) + rr(x - 70, y + 10, 166, 46, 23, o.c2)).join(""));
add("shapes", "sun", "Sun", "summer happy", "#ffb300", "#ff7043", o =>
  poly(pts(256, 256, 236, 170, 12), o.c2) + circ(256, 256, 150, o.c1));
add("shapes", "trophy", "Trophy", "winner champion", "#ffc400", "#8d6e63", o =>
  line("M150 140Q60 140 80 220Q100 280 170 280M362 140Q452 140 432 220Q412 280 342 280", o.c1, 26) +
  path("M136 96H376V200Q376 320 256 330Q136 320 136 200Z", o.c1) + rr(230, 320, 52, 70, 8, shade(o.c1, -0.2)) +
  rr(150, 386, 212, 70, 14, o.c2) + txt("1", { y: 210, size: 130, fill: "#fff", sw: 0 }));
add("shapes", "money", "Money", "cash pera rich", "#2ecc71", "#ffffff", o =>
  rr(50, 120, 412, 240, 26, shade(o.c1, -0.25), 'transform="rotate(-8 256 256)"') + rr(50, 140, 412, 240, 26, o.c1) +
  rr(80, 168, 352, 184, 16, "none", `stroke="${o.c2}" stroke-width="8" opacity=".7"`) + circ(256, 260, 70, o.c2, 'opacity=".25"') + txt("$", { y: 262, size: 130, fill: o.c2 }));
add("shapes", "pin", "Location pin", "map place", "#ff3b30", "#ffffff", o =>
  path("M256 40C340 40 404 104 404 188C404 300 256 472 256 472C256 472 108 300 108 188C108 104 172 40 256 40Z", o.c1) + circ(256, 186, 60, o.c2));
add("shapes", "camera", "Camera", "photo picture", "#3d3d46", "#00c2ff", o =>
  rr(176, 92, 160, 70, 20, o.c1) + rr(40, 136, 432, 300, 50, o.c1) + circ(256, 286, 118, "#fff") + circ(256, 286, 86, o.c2) + circ(226, 256, 22, "#fff", 'opacity=".8"') + circ(410, 190, 18, "#ffcc00"));

/* FACES ------------------------------------------------------ */
const eye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="38" fill="${FACE_IN}"/>`;
add("faces", "happy", "Happy", "smile emoji", "#ffcc33", "#ff6b6b", o => face(o, "a",
  eye(186, 200) + eye(326, 200) + path("M150 286Q256 410 362 286Z", FACE_IN, `stroke="${FACE_IN}" stroke-width="16" stroke-linejoin="round"`) +
  circ(140, 300, 30, o.c2, 'opacity=".45"') + circ(372, 300, 30, o.c2, 'opacity=".45"')));
add("faces", "laugh", "Laughing", "lol tears emoji", "#ffcc33", "#4fc3ff", o => face(o, "b",
  line("M150 210Q186 168 222 210M290 210Q326 168 362 210", FACE_IN, 22) +
  path("M134 268L378 268Q378 410 256 410Q134 410 134 268Z", FACE_IN) + path("M152 278L360 278L352 310L160 310Z", "#fff") +
  path("M200 380Q256 340 312 380Q290 404 256 404Q222 404 200 380Z", "#ff6b81") +
  drop(76, 220, 1.4, o.c2) + drop(436, 220, 1.4, o.c2)));
add("faces", "love", "Heart eyes", "inlove crush emoji", "#ffcc33", "#ff2d55", o => face(o, "c",
  heartAt(184, 206, .3, o.c2) + heartAt(328, 206, .3, o.c2) + path("M156 296Q256 400 356 296Z", FACE_IN, `stroke="${FACE_IN}" stroke-width="16" stroke-linejoin="round"`)));
add("faces", "shocked", "Shocked", "wow omg surprised emoji", "#ffcc33", "#ffffff", o => face(o, "d",
  circ(186, 200, 46, o.c2) + circ(326, 200, 46, o.c2) + circ(186, 204, 22, FACE_IN) + circ(326, 204, 22, FACE_IN) +
  line("M146 130Q186 100 222 122M290 122Q326 100 366 130", FACE_IN, 14) + `<ellipse cx="256" cy="340" rx="50" ry="64" fill="${FACE_IN}"/>`));
add("faces", "sad", "Sad", "cry tear emoji", "#ffcc33", "#4fc3ff", o => face(o, "e",
  eye(186, 214) + eye(326, 214) + line("M140 160L216 140M296 140L372 160", FACE_IN, 14) + line("M176 360Q256 300 336 360", FACE_IN, 22) + drop(160, 290, 1.1, o.c2)));
add("faces", "angry", "Angry", "mad galit emoji", "#ff5a36", "#3a2410", o => face(o, "f",
  line("M136 150L222 196M376 150L290 196", o.c2, 22) + eye(190, 226) + eye(322, 226) + line("M180 360Q256 312 332 360", o.c2, 22)));
add("faces", "cool", "Cool", "sunglasses swag emoji", "#ffcc33", INK, o => face(o, "g",
  path("M96 176H416L404 212Q396 262 336 262Q284 262 276 212L268 196H244L236 212Q228 262 176 262Q116 262 108 212Z", o.c2) +
  line("M126 196L170 196", "#fff", 10, 'opacity=".5"') + line("M150 330Q256 380 360 310", FACE_IN, 20)));
add("faces", "wink", "Wink", "tongue playful emoji", "#ffcc33", "#ff6b81", o => face(o, "h",
  eye(186, 200) + line("M290 204Q326 230 362 204", FACE_IN, 20) + path("M160 290Q256 380 352 290Z", FACE_IN) +
  path("M250 330Q256 420 300 410Q330 400 320 330Z", o.c2)));
add("faces", "cry", "Crying", "iyak sad tears emoji", "#ffcc33", "#4fc3ff", o => face(o, "i",
  line("M146 200Q186 230 222 200M290 200Q326 230 366 200", FACE_IN, 20) + path("M176 380Q256 290 336 380Z", FACE_IN) +
  rr(156, 220, 36, 200, 18, o.c2, 'opacity=".9"') + rr(320, 220, 36, 200, 18, o.c2, 'opacity=".9"')));
add("faces", "think", "Thinking", "hmm wonder emoji", "#ffcc33", "#e0a030", o => face(o, "j",
  line("M150 160L216 150M296 136L366 156", FACE_IN, 14) + eye(186, 210) + eye(326, 210) + line("M200 330L320 316", FACE_IN, 20) +
  path("M190 470Q170 400 220 380L330 380Q356 384 350 404Q346 418 320 418L268 418Q300 450 282 470Z", o.c2, `stroke="${shade(o.c2, -0.3)}" stroke-width="8" stroke-linejoin="round"`)));

/* LABELS & BADGES ------------------------------------------- */
add("labels", "new", "NEW", "badge seal", "#ff2d55", "#ffffff", o =>
  poly(pts(256, 256, 230, 196, 20), o.c1) + circ(256, 256, 168, "none", `stroke="${o.c2}" stroke-width="6" stroke-dasharray="14 10" opacity=".7"`) +
  fitTxt(o.text, { size: 120, maxW: 280, fill: o.c2, rot: -10 }), { text: "NEW" });
add("labels", "sale", "SALE tag", "price discount", "#ff3b30", "#ffffff", o =>
  path("M60 150Q60 130 80 130L340 130L460 256L340 382L80 382Q60 382 60 362Z", o.c1, `stroke="${o.c1}" stroke-width="20" stroke-linejoin="round"`) +
  circ(384, 256, 22, o.c2) + fitTxt(o.text, { x: 200, y: 258, size: 110, maxW: 236, fill: o.c2 }), { text: "SALE" });
add("labels", "off", "% OFF seal", "discount promo sale", "#ffd600", "#d50000", o =>
  poly(pts(256, 256, 232, 200, 24), o.c1) + fitTxt(o.text, { y: 228, size: 150, maxW: 320, fill: o.c2, rot: -6 }) +
  fitTxt(o.text2, { y: 346, size: 70, maxW: 220, fill: o.c2, rot: -6 }), { text: "50%", text2: "OFF" });
add("labels", "live", "LIVE", "stream broadcast", "#ff1744", "#ffffff", o =>
  rr(36, 166, 440, 180, 34, o.c1) + circ(110, 256, 30, o.c2) + circ(110, 256, 48, "none", `stroke="${o.c2}" stroke-width="8" opacity=".5"`) +
  fitTxt(o.text, { x: 306, y: 258, size: 108, maxW: 250, fill: o.c2 }), { text: "LIVE" });
add("labels", "rec", "REC", "recording camera", "#1b1b1f", "#ff1744", o =>
  rr(46, 176, 420, 160, 28, o.c1, 'opacity=".85"') + circ(140, 256, 40, o.c2) + fitTxt(o.text, { x: 300, y: 258, size: 100, maxW: 230, fill: "#fff" }), { text: "REC", border: false });
add("labels", "breaking", "Breaking news", "tv headline", "#d50000", "#ffffff", o =>
  rr(24, 150, 464, 120, 6, o.c1) + fitTxt(o.text, { y: 212, size: 84, maxW: 420, fill: "#fff", ls: 2 }) +
  rr(24, 270, 464, 92, 6, o.c2) + fitTxt(o.text2, { y: 318, size: 66, maxW: 420, fill: o.c1, ls: 6 }), { text: "BREAKING", text2: "NEWS" });
add("labels", "free", "FREE ribbon", "banner libre", "#00c853", "#007a33", o =>
  ribbon(o.c1, o.c2) + fitTxt(o.text, { y: 258, size: 92, maxW: 290, fill: "#fff" }), { text: "FREE" });
add("labels", "bestseller", "Best seller ribbon", "banner top", "#ff6d00", "#b23c00", o =>
  ribbon(o.c1, o.c2) + fitTxt(o.text, { y: 258, size: 70, maxW: 300, fill: "#fff" }), { text: "BEST SELLER" });
add("labels", "comingsoon", "Coming soon ribbon", "banner soon", "#2962ff", "#0d2c8c", o =>
  ribbon(o.c1, o.c2) + fitTxt(o.text, { y: 258, size: 66, maxW: 300, fill: "#fff" }), { text: "COMING SOON" });
add("labels", "soldout", "Sold out stamp", "stamp ubos", "#e53935", "#e53935", o =>
  `<g transform="rotate(-14 256 256)">${rr(46, 166, 420, 180, 18, "#fff", `stroke="${o.c1}" stroke-width="16"`)}${rr(66, 186, 380, 140, 10, "none", `stroke="${o.c1}" stroke-width="5"`)}${fitTxt(o.text, { y: 258, size: 92, maxW: 330, fill: o.c2 })}</g>`, { text: "SOLD OUT" });
add("labels", "hot", "HOT", "fire trending", "#ff3d00", "#ffd23f", o =>
  path("M256 36C300 128 404 170 394 300C386 404 322 474 256 474C178 474 116 412 118 320C120 250 168 208 178 146C214 188 220 228 230 250C252 178 240 110 256 36Z", o.c1) +
  fitTxt(o.text, { y: 340, size: 110, maxW: 260, fill: o.c2, sw: 18, rot: -8 }), { text: "HOT" });
add("labels", "top1", "Top 1 medal", "winner award", "#ffc400", "#2962ff", o =>
  poly("170,40 236,40 256,220 196,220", o.c2) + poly("342,40 276,40 256,220 316,220", shade(o.c2, -0.3)) +
  circ(256, 316, 156, shade(o.c1, -0.15)) + circ(256, 316, 128, o.c1) + fitTxt(o.text, { y: 320, size: 120, maxW: 200, fill: "#fff", sw: 14, stroke: shade(o.c1, -0.4) }), { text: "#1" });
add("labels", "verified", "Verified", "check badge official", "#1d9bf0", "#ffffff", o =>
  poly(pts(256, 256, 226, 190, 12), o.c1, `stroke="${o.c1}" stroke-width="30" stroke-linejoin="round"`) + line("M162 262L232 330L356 194", o.c2, 46));
add("labels", "promo", "PROMO", "deal offer", "#aa00ff", "#ffea00", o =>
  BG.tilt(o.c1) + fitTxt(o.text, { y: 258, size: 110, maxW: 360, fill: o.c2, sw: 18, rot: -7 }), { text: "PROMO" });

/* TITLES & LOWER THIRDS (no white border by default) --------- */
add("titles", "nametag", "Name tag (lower third)", "lower third intro", "#ff2d55", "#ffffff", o =>
  rr(24, 196, 464, 98, 6, o.c1) + rr(24, 196, 14, 98, 0, o.c2) +
  fitTxt(o.text, { x: 60, y: 246, size: 62, maxW: 410, fill: "#fff", anchor: "start" }) +
  rr(24, 294, 330, 58, 6, o.c2) + fitTxt(o.text2, { x: 44, y: 324, size: 34, maxW: 300, fill: o.c1, anchor: "start", weight: 700 }),
  { text: "JUAN DELA CRUZ", text2: "Content Creator", border: false });
add("titles", "locationtag", "Location tag", "place map travel", "#ffffff", "#ff3b30", o =>
  rr(24, 196, 464, 120, 60, o.c1, 'opacity=".95"') +
  path("M110 210C140 210 162 232 162 262C162 300 110 346 110 346C110 346 58 300 58 262C58 232 80 210 110 210Z", o.c2) + circ(110, 262, 18, o.c1) +
  fitTxt(o.text, { x: 186, y: 258, size: 60, maxW: 280, fill: INK, anchor: "start" }), { text: "Manila, PH", border: false });
add("titles", "episode", "Episode badge", "series vlog number", "#ffd000", INK, o =>
  rr(36, 176, 440, 160, 20, o.c2) + rr(56, 196, 400, 120, 12, "none", `stroke="${o.c1}" stroke-width="6"`) +
  fitTxt(o.text, { y: 258, size: 80, maxW: 360, fill: o.c1, ls: 4 }), { text: "EPISODE 1", border: false });
add("titles", "part", "Part badge", "series number", "#00e5ff", INK, o =>
  rr(116, 136, 280, 240, 40, o.c1, 'transform="rotate(-6 256 256)"') +
  fitTxt(o.text, { y: 214, size: 64, maxW: 220, fill: o.c2, rot: -6 }) + fitTxt(o.text2, { y: 304, size: 130, maxW: 200, fill: o.c2, rot: -6 }), { text: "PART", text2: "2" });
add("titles", "theend", "The End", "outro ending", "#ffffff", INK, o =>
  fitTxt(o.text, { y: 256, size: 130, maxW: 440, fill: o.c1, family: SERIF, weight: 700, italic: true, sw: 20, stroke: o.c2 }), { text: "The End" });
add("titles", "tobecontinued", "To be continued", "outro arrow", "#c8a165", INK, o =>
  poly("24,180 400,180 488,256 400,332 24,332", o.c1) + fitTxt(o.text, { x: 214, y: 258, size: 64, maxW: 360, fill: o.c2, family: SERIF, weight: 700, italic: true }),
  { text: "To be continued", border: false });
add("titles", "countdown", "Countdown number", "3 2 1 timer", "#ff2d55", "#ffffff", o =>
  circ(256, 256, 210, o.c1) + circ(256, 256, 176, "none", `stroke="${o.c2}" stroke-width="10" opacity=".6"`) + fitTxt(o.text, { y: 266, size: 250, maxW: 260, fill: o.c2 }), { text: "3" });
add("titles", "quote", "Quote box", "caption text", "#1b1b1f", "#ffd000", o =>
  rr(36, 140, 440, 232, 24, o.c1, 'opacity=".88"') + txt("“", { x: 92, y: 180, size: 150, fill: o.c2, family: SERIF }) +
  fitTxt(o.text, { y: 270, size: 52, maxW: 380, fill: "#fff", weight: 700 }), { text: "Your quote here", border: false });

/* ---------- wrapper: adds white die-cut border + shadow, optional flip ---------- */
function render(st, opts = {}) {
  const o = { c1: st.c1, c2: st.c2, text: st.text, text2: st.text2, ...opts };
  const border = opts.border ?? (st.border !== false);
  const shadow = opts.shadow ?? border;
  const flip = opts.flip ? ' transform="translate(512 0) scale(-1 1)"' : "";
  const bw = opts.borderWidth ?? 14;
  let drawn;
  const filt = border || shadow ? `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="${border ? bw : 0}" result="d"/>
<feFlood flood-color="${opts.borderColor || "#ffffff"}"/><feComposite in2="d" operator="in" result="bd"/>
<feGaussianBlur in="d" stdDeviation="7"/><feOffset dy="7" result="sb"/><feFlood flood-color="#000" flood-opacity="${shadow ? .32 : 0}"/><feComposite in2="sb" operator="in" result="sh"/>
<feMerge><feMergeNode in="sh"/>${border ? '<feMergeNode in="bd"/>' : ""}<feMergeNode in="SourceGraphic"/></feMerge></filter>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 560 560" width="560" height="560">` +
    (filt ? `<defs>${filt}</defs>` : "") +
    `<g${filt ? ' filter="url(#stk)"' : ""}><g${flip}>${(FLIP = !!opts.flip, drawn = st.draw(o), FLIP = false, drawn)}</g></g></svg>`;
}

const CATEGORIES = [
  ["social", "📱 Social"], ["reactions", "💬 Reactions"], ["bubbles", "🗨 Bubbles"], ["arrows", "➡ Arrows"],
  ["shapes", "⭐ Shapes"], ["faces", "😀 Faces"], ["labels", "🏷 Labels"], ["titles", "🎬 Titles"],
];
const api = { STICKERS: L, CATEGORIES, render };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.FreeStickers = api;
})(typeof window !== "undefined" ? window : globalThis);
