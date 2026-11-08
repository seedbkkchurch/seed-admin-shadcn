import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";

// สร้างการ์ดข้อพระคัมภีร์แบบ "GIF เคลื่อนไหว" (grill-me 2026-11-08):
// แยกเฟรมของ GIF พื้นหลัง (gifuct-js) → วาดลง canvas ขนาดการ์ดครึ่งหนึ่ง
// (540x675) แบบ object-fit: cover → วาด overlay (ไล่เฉดดำ + ข้อความ + โลโก้
// ที่ render ไว้ครั้งเดียวด้วย html-to-image) ทับทุกเฟรม → รวมเป็น GIF
// (gifenc) ทำในเบราว์เซอร์ทั้งหมด ไม่ต้องมีเซิร์ฟเวอร์
//
// ขนาด 540x675 เพื่อให้ไฟล์ไม่ใหญ่เกิน (~2-6MB) และสร้างเสร็จเร็วบนมือถือ
// GIF มีได้ 256 สี/เฟรม พื้นไล่เฉดจะเป็นขั้นนิดหน่อย — ยอมรับแล้ว

export const ANIMATED_WIDTH = 540;
export const ANIMATED_HEIGHT = 675;
// จำกัดจำนวนเฟรมที่เขียนลงไฟล์ (GIF ยาวมากจะข้ามเฟรมแล้วรวม delay แทน)
const MAX_OUTPUT_FRAMES = 72;
const MIN_DELAY_MS = 30;
const BASE_COLOR = "#1F2A24";

type Options = {
  gifUrl: string;
  overlay: CanvasImageSource;
  onProgress?: (ratio: number) => void;
  signal?: { cancelled: boolean };
};

export async function buildAnimatedVerseGif({
  gifUrl,
  overlay,
  onProgress,
  signal,
}: Options): Promise<Blob | null> {
  const res = await fetch(gifUrl, { mode: "cors" });
  if (!res.ok) throw new Error(`โหลด GIF ไม่สำเร็จ (${res.status})`);
  const gif = parseGIF(await res.arrayBuffer());
  const frames = decompressFrames(gif, true);
  if (frames.length === 0) throw new Error("GIF ไม่มีเฟรม");

  const gw = gif.lsd.width;
  const gh = gif.lsd.height;

  // canvas สะสมภาพเต็มของ GIF (เฟรมของ GIF มักเป็นแค่ส่วนที่เปลี่ยน)
  const full = document.createElement("canvas");
  full.width = gw;
  full.height = gh;
  const fullCtx = full.getContext("2d", { willReadFrequently: true })!;
  const patchCanvas = document.createElement("canvas");
  const patchCtx = patchCanvas.getContext("2d")!;

  const out = document.createElement("canvas");
  out.width = ANIMATED_WIDTH;
  out.height = ANIMATED_HEIGHT;
  const outCtx = out.getContext("2d", { willReadFrequently: true })!;

  // object-fit: cover
  const scale = Math.max(ANIMATED_WIDTH / gw, ANIMATED_HEIGHT / gh);
  const dw = gw * scale;
  const dh = gh * scale;
  const dx = (ANIMATED_WIDTH - dw) / 2;
  const dy = (ANIMATED_HEIGHT - dh) / 2;

  const step = Math.max(1, Math.ceil(frames.length / MAX_OUTPUT_FRAMES));
  const encoder = GIFEncoder();
  let pendingDelay = 0;
  let restoreData: ImageData | null = null;

  for (let i = 0; i < frames.length; i++) {
    if (signal?.cancelled) return null;
    const frame = frames[i];
    const { width, height, left, top } = frame.dims;

    if (frame.disposalType === 3) {
      restoreData = fullCtx.getImageData(0, 0, gw, gh);
    }

    patchCanvas.width = width;
    patchCanvas.height = height;
    patchCtx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.patch), width, height),
      0,
      0,
    );
    fullCtx.drawImage(patchCanvas, left, top);

    pendingDelay += frame.delay || 100;
    const isLast = i === frames.length - 1;
    if (i % step === 0 || isLast) {
      outCtx.fillStyle = BASE_COLOR;
      outCtx.fillRect(0, 0, ANIMATED_WIDTH, ANIMATED_HEIGHT);
      outCtx.drawImage(full, dx, dy, dw, dh);
      outCtx.drawImage(overlay, 0, 0, ANIMATED_WIDTH, ANIMATED_HEIGHT);
      const { data } = outCtx.getImageData(
        0,
        0,
        ANIMATED_WIDTH,
        ANIMATED_HEIGHT,
      );
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      encoder.writeFrame(index, ANIMATED_WIDTH, ANIMATED_HEIGHT, {
        palette,
        delay: Math.max(MIN_DELAY_MS, pendingDelay),
      });
      pendingDelay = 0;
      onProgress?.((i + 1) / frames.length);
      // คืน main thread ให้ UI ขยับ (progress) ระหว่างเข้ารหัส
      await new Promise((r) => setTimeout(r, 0));
    }

    // disposal: 2 = ล้างพื้นที่เฟรมนี้ก่อนเฟรมถัดไป, 3 = คืนภาพก่อนหน้า
    if (frame.disposalType === 2) {
      fullCtx.clearRect(left, top, width, height);
    } else if (frame.disposalType === 3 && restoreData) {
      fullCtx.putImageData(restoreData, 0, 0);
      restoreData = null;
    }
  }

  encoder.finish();
  return new Blob([encoder.bytes() as BlobPart], { type: "image/gif" });
}
