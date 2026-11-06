const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'shelter', 'images', 'thumbnail-emergency-bg-v1.png');
const output = path.join(root, 'portal', 'shelter-thumbnail-360x240.jpg');
const preview = path.join(root, 'portal', 'shelter-thumbnail-1080x720.png');

const width = 1080;
const height = 720;
const mint = '#00b4c9';
const overlay = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#030708" stop-opacity=".93"/>
      <stop offset=".48" stop-color="#030708" stop-opacity=".58"/>
      <stop offset=".78" stop-color="#030708" stop-opacity=".08"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#shade)"/>
  <text x="74" y="64" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="22" font-weight="700" letter-spacing="2.2" fill="#f7f9f9">편집#003</text>
  <line x1="74" y1="86" x2="184" y2="86" stroke="${mint}" stroke-width="5"/>
  <text x="72" y="280" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="78" font-weight="900" letter-spacing="-4.5" fill="#f7f9f9">대한민국,</text>
  <text x="72" y="374" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="78" font-weight="900" letter-spacing="-4.5" fill="#f7f9f9">준비됐나요?</text>
  <text x="74" y="451" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="30" font-weight="700" letter-spacing="-.8" fill="${mint}">경보 이후 5분</text>
  <text x="74" y="501" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="22" font-weight="400" letter-spacing="-.5" fill="#c5cdcf">당신은 어떤 선택을 하시겠습니까?</text>
</svg>`);

async function render() {
  const full = await sharp(source)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay }])
    .png()
    .toBuffer();

  await sharp(full).png({ compressionLevel: 9 }).toFile(preview);
  await sharp(full).resize(360, 240).jpeg({ quality: 94, progressive: true, mozjpeg: true }).toFile(output);
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
