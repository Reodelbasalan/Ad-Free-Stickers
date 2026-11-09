// Builds every sticker into stickers/svg/<category>/<id>.svg and stickers/png/<category>/<id>.png (512px, transparent)
// Usage: node build/build.js            (needs: npm i playwright  — uses Chromium to draw PNGs)
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const ROOT = path.join(__dirname, "..");
const { STICKERS, render } = require(path.join(ROOT, "stickers.js"));
const SIZE = +(process.env.SIZE || 512);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<canvas></canvas>");
  const manifest = [];
  for (const st of STICKERS) {
    const svg = render(st);
    const svgFile = path.join(ROOT, "stickers/svg", st.cat, st.id + ".svg");
    const pngFile = path.join(ROOT, "stickers/png", st.cat, st.id + ".png");
    fs.mkdirSync(path.dirname(svgFile), { recursive: true }); fs.mkdirSync(path.dirname(pngFile), { recursive: true });
    fs.writeFileSync(svgFile, svg);
    const b64 = await page.evaluate(async ({ svg, size, id }) => {
      const bad = new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror");
      if (bad) throw new Error(`Sticker "${id}" has broken SVG: ${bad.textContent.slice(0, 160)}`);
      const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement("canvas"); c.width = c.height = size;
      c.getContext("2d").drawImage(img, 0, 0, size, size);
      return c.toDataURL("image/png").split(",")[1];
    }, { svg, size: SIZE, id: st.id });
    fs.writeFileSync(pngFile, Buffer.from(b64, "base64"));
    manifest.push({ id: st.id, name: st.name, category: st.cat, tags: st.tags, svg: path.relative(ROOT, svgFile), png: path.relative(ROOT, pngFile) });
  }
  fs.writeFileSync(path.join(ROOT, "stickers/stickers.json"), JSON.stringify(manifest, null, 2));
  await browser.close();
  console.log(`✅ Built ${STICKERS.length} stickers → stickers/svg and stickers/png (${SIZE}px)`);
})();
