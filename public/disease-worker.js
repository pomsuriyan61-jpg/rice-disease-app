// Web Worker นี้รันแยก thread เพื่อไม่ให้ตัวแปร global "Module" ชนกับโมเดลอีกตัว
// วางไฟล์จากโฟลเดอร์ "rice-disease-classifier1-wasm-browser-simd-v1-impulse-_1.zip" (ตัววิเคราะห์โรค 6 คลาส)
// ไว้ที่ ./models/disease/ แล้วแก้ path ด้านล่างให้ตรง
importScripts('./models/disease/edge-impulse-standalone.js');
importScripts('./models/disease/run-impulse.js');

let classifier = null;
let ready = init();

async function init() {
  classifier = new EdgeImpulseClassifier();
  await classifier.init();
}

self.onmessage = async (e) => {
  try {
    await ready;
    const result = classifier.classify(e.data.features);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: err.message || String(err) });
  }
};
