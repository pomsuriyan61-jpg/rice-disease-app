const express = require('express');
const cors = require('cors');
const Jimp = require('jimp');

const { EdgeImpulseClassifier: LeafClassifierCtor } = require('./leaf/classifier-bundle.js');
const { EdgeImpulseClassifier: DiseaseClassifierCtor } = require('./disease/classifier-bundle.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let leafClassifier, diseaseClassifier, ready = false;

async function initClassifiers() {
  leafClassifier = new LeafClassifierCtor();
  await leafClassifier.init();
  diseaseClassifier = new DiseaseClassifierCtor();
  await diseaseClassifier.init();
  ready = true;
  console.log('✅ โหลดโมเดลทั้งสองตัวสำเร็จ พร้อมรับคำขอ');
}

// แปลงรูปเป็น feature array แบบ packed-RGB (224x224) ตามฟอร์แมตที่ Edge Impulse ต้องการ
async function imageToFeatures(buffer) {
  const image = await Jimp.read(buffer);
  image.resize(224, 224);
  const features = new Array(224 * 224);
  let i = 0;
  image.scan(0, 0, 224, 224, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    features[i++] = (r << 16) | (g << 8) | b;
  });
  return features;
}

app.get('/', (req, res) => res.json({ status: ready ? 'ready' : 'loading' }));

app.post('/classify', async (req, res) => {
  if (!ready) return res.status(503).json({ error: 'โมเดลกำลังโหลด กรุณาลองใหม่อีกครั้งใน 2-3 วินาที' });
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'missing image (base64)' });
    const base64 = image.includes(',') ? image.split(',')[1] : image;
    const buffer = Buffer.from(base64, 'base64');

    const features = await imageToFeatures(buffer);

    const leafResult = leafClassifier.classify(features);
    const riceScore = leafResult.results.find(r => r.label === 'Rice')?.value ?? 0;
    const notRiceScore = leafResult.results.find(r => r.label === 'not Rice')?.value ?? 0;

    if (notRiceScore >= riceScore) {
      return res.json({ isRice: false, leafResults: leafResult.results });
    }

    const diseaseResult = diseaseClassifier.classify(features);
    const top = diseaseResult.results.reduce((a, b) => (b.value > a.value ? b : a));

    res.json({
      isRice: true,
      label: top.label,
      confidence: top.value,
      leafResults: leafResult.results,
      diseaseResults: diseaseResult.results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
initClassifiers().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
