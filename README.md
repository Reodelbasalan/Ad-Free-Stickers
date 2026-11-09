# ✨ Free Stickers

**98 libreng stickers** para sa videos, thumbnails, reels at posts. Original designs, walang watermark, at puwede kahit sa **commercial** use (MIT License).

🌐 **Try it online:** https://reodelbasalan.github.io/Free-Stickers/

- 🖼 Ready na **PNG** (transparent, 512px) at **SVG** (puwedeng i-resize nang hindi lumalabo)
- ✏️ **Web editor**: palitan ang text at kulay, i-flip, white border, shadow, at i-download hanggang 2048px
- 🎬 **Video script**: ilagay ang sticker sa video na may animation (pop, bounce, slide, wiggle, spin…)

## 📦 Categories

| Category | Ilan | Halimbawa |
|---|---|---|
| 📱 Social | 12 | Subscribe, Like, Follow, Bell, Share, Link in bio, Swipe up |
| 💬 Reactions | 20 | WOW!, OMG, GRABE!, SANA ALL, LODI, PETMALU, CHAR!, KILIG, PANALO! |
| 🗨 Bubbles | 6 | Speech, Chat, Thought, Shout, Whisper, Comic caption |
| ➡ Arrows | 9 | Arrow, Curved, Hand-drawn, Circle highlight, Look!, Underline |
| ⭐ Shapes | 19 | Star, Heart, Sparkles, Fire, Crown, Check, X, 100, Trophy, Money, Pin |
| 😀 Faces | 10 | Happy, Laughing, Heart eyes, Shocked, Sad, Angry, Cool, Crying |
| 🏷 Labels | 14 | NEW, SALE, 50% OFF, LIVE, REC, Breaking News, Sold out, Verified |
| 🎬 Titles | 8 | Name tag (lower third), Location, Episode, Part 2, The End, Countdown |

## 🚀 Paano gamitin

### 1. Kunin lang ang PNG
Nasa `stickers/png/<category>/` lahat. I-drag sa CapCut, Canva, Premiere, VN, Photoshop, kahit saan.

### 2. Web editor (para i-customize)
I-double-click ang **`index.html`** (pinakamaganda sa Chrome o Edge).
1. Hanapin o pumili ng category, tapos i-click ang sticker.
2. Palitan ang **text** at **kulay**. May **Flip**, **White border**, **Shadow**, at **Border size/color**.
3. **⬇ PNG** (256–2048px), **⬇ SVG**, o **📋 Copy** para i-paste diretso sa editor mo.

> O buksan lang online, gumagana pati sa phone: https://reodelbasalan.github.io/Free-Stickers/

### 3. Ilagay sa video na may animation (FFmpeg)
Kailangan ng [FFmpeg](https://ffmpeg.org) (Windows: `winget install ffmpeg` · Mac: `brew install ffmpeg` · Linux: `sudo apt install ffmpeg`).

Isang beses lang, gawing runnable ang script:

```bash
chmod +x scripts/*.sh
```

Tapos:

```bash
./scripts/add-sticker.sh -i video.mp4 -s stickers/png/social/subscribe.png -o final.mp4
```

| Flag | Default | Meaning |
|---|---|---|
| `-i` | (required) | Input video |
| `-s` | (required) | Sticker PNG |
| `-o` | (required) | Output video |
| `-p` | `bottom-right` | `center` `top` `bottom` `left` `right` `top-left` `top-right` `bottom-left` `bottom-right`, o `X,Y` pixels |
| `-w` | `0.3` | Laki (bahagi ng video width, `0.05`–`1.0`) |
| `-a` | `pop` | `pop` `fade` `slide-left` `slide-right` `slide-up` `slide-down` `bounce` `float` `wiggle` `spin` `pulse` `shake` `none` |
| `-t` | `0` | Kailan lalabas (seconds) |
| `-e` | end of video | Kailan mawawala (seconds) |

Maraming stickers? Patakbuhin ulit sa output:

```bash
./scripts/add-sticker.sh -i video.mp4 -s stickers/png/social/like.png -p top-left -a bounce -o step1.mp4
./scripts/add-sticker.sh -i step1.mp4 -s stickers/png/reactions/wow.png -p center -a pop -t 2 -e 4 -o final.mp4
```

Gumagana sa portrait (TikTok/Reels) at landscape videos. Kasama ang original audio.

> 🪟 Windows: gamitin ang **Git Bash** (kasama sa [Git for Windows](https://git-scm.com/download/win)) para ma-run ang `.sh`.

## 🛠 Gumawa ng sariling sticker (para sa developers)

Lahat ng designs ay nasa **`stickers.js`** bilang SVG code. Ginagamit ito ng web editor at ng build script. Para magdagdag:

```js
add("shapes", "my-id", "My sticker", "search tags", "#ff2d55", "#ffffff", o =>
  circ(256, 256, 200, o.c1) + fitTxt(o.text, { fill: o.c2, sw: 18 }), { text: "HELLO" });
```

Tapos i-rebuild ang PNG at SVG files:

```bash
npm install
npx playwright install chromium
npm run build
```

## 📁 Files

```
index.html               ← Web editor (buksan lang sa browser)
stickers.js              ← Lahat ng sticker designs (source)
stickers/png/            ← 98 transparent PNGs (512px)
stickers/svg/            ← 98 SVGs (any size)
stickers/stickers.json   ← List ng lahat (id, name, category, tags, files)
scripts/add-sticker.sh   ← Animated sticker sa video
build/build.js           ← Gumagawa ng PNG/SVG mula sa stickers.js
```

## License

MIT, kaya libre gamitin, i-edit, at i-share, pati sa commercial videos at products.
