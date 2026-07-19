// Web Worker นี้รันแยก thread เพื่อไม่ให้ตัวแปร global "Module" ชนกับโมเดลอีกตัว
// วางไฟล์จากโฟลเดอร์ "rice-disease-wasm-browser-simd-v8-impulse-_4.zip" (ตัวคัดแยกใบข้าว/ไม่ใช่)
// ไว้ที่ ./models/leaf-gate/ แล้วแก้ path ด้านล่างให้ตรง
importScripts('./models/leaf-gate/edge-impulse-standalone.js');
importScripts('./models/leaf-gate/run-impulse.js');

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
