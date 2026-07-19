// Web Worker นี้รันแยก thread เพื่อไม่ให้ตัวแปร global "Module" ชนกับโมเดลอีกตัว
// วางไฟล์จากโฟลเดอร์ "rice-disease-wasm-browser-simd-v8-impulse-_4.zip" (ตัวคัดแยกใบข้าว/ไม่ใช่)
// ไว้ที่ ./models/leaf-gate/ แล้วแก้ path ด้านล่างให้ตรง
postMessage({ progress: 'เริ่ม importScripts glue code...' });
importScripts('./models/leaf-gate/edge-impulse-standalone.js');
postMessage({ progress: 'importScripts glue code สำเร็จ, กำลังโหลด run-impulse.js...' });
importScripts('./models/leaf-gate/run-impulse.js');
postMessage({ progress: 'importScripts ครบแล้ว, เริ่ม init classifier (กำลังโหลด .wasm)...' });

let classifier = null;
let ready = init();

async function init() {
  try {
    classifier = new EdgeImpulseClassifier();
    await classifier.init();
    postMessage({ progress: '✅ init สำเร็จ, wasm โหลดและ compile เรียบร้อย' });
  } catch (err) {
    postMessage({ progress: '❌ init ล้มเหลว: ' + (err.message || String(err)) });
    throw err;
  }
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
