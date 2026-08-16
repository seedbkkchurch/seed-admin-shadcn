// Vercel Edge Middleware — งานเดียว: ทำให้ preview card ตอนแปะลิงก์
// /devotion/:id ใน LINE (หรือแพลตฟอร์มอื่นที่ crawl og tags) ขึ้นชื่อ/รูป
// ของเฝ้าเดี่ยวเรื่องนั้นจริงๆ แทนที่จะเป็นค่า og:title/og:image ตายตัวจาก
// index.html (เว็บนี้เป็น SPA ล้วนไม่มี SSR — crawler ของ LINE ไม่รัน JS
// เลยอ่านค่า dynamic จาก React ไม่ได้) ดู grill-me 2026-08-16
// "เฝ้าเดียวทำให้สามารถเห็นได้โดยไม่ต้อง login อยากให้มีปุ่มแชร์...ในไลน์"
//
// ทำงานเฉพาะ request ที่ user-agent ตรงกับ bot/crawler ที่รู้จักเท่านั้น —
// ผู้ใช้จริงทุกคน (มือถือ/desktop/ในแอป LINE เอง) ไม่โดนแตะเลย ปล่อยผ่านไป
// SPA ตามปกติ (ตั้งค่า SPA fallback อยู่ใน Vercel dashboard อยู่แล้ว ไม่ได้
// อยู่ใน repo — ดู grill-me เดียวกัน) กันบอทเห็นไม่ตรงกับที่ผู้ใช้เห็นเอง
// ให้น้อยที่สุด
//
// อยู่ที่ root ของ repo (ไม่ใช่ src/) ตามที่ Vercel Edge Middleware กำหนด —
// ไม่ได้อยู่ใน tsconfig.app.json/tsconfig.node.json ใดๆ (ทั้งสองไฟล์ include
// เฉพาะ src/ กับ vite.config.ts) จึงไม่โดน `tsc -b` ตอน build ตรวจ/บล็อก —
// Vercel build ไฟล์นี้แยกต่างหากด้วย toolchain ของตัวเอง
export const config = {
  matcher: ["/devotion/:id"],
};

// รายชื่อ user-agent ของ crawler/bot ที่ทำ link preview ที่พบบ่อย — เพิ่มได้
// ทีหลังถ้าเจอแพลตฟอร์มอื่นที่ preview ไม่ขึ้น ไม่ต้องครบทุกตัวตั้งแต่แรก
const BOT_USER_AGENT_PATTERN =
  /facebookexternalhit|line\/|line-poker|twitterbot|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|pinterest|redditbot|vkshare|skypeuripreview|viber/i;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return; // ไม่ใช่ bot — ปล่อยผ่านไป SPA ตามปกติ ไม่ทำอะไรเลย
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const devotionId = segments[segments.length - 1];

  // ใช้ env var ชื่อเดียวกับที่ฝั่ง client ใช้ (src/lib/supabase/client.ts)
  // — เป็น publishable/anon key อยู่แล้ว ไม่ใช่ secret ตั้งไว้ที่เดียวกันใน
  // Vercel project settings ก็พอ ไม่ต้องเพิ่ม env var ใหม่
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !devotionId) {
    return; // ตั้งค่าไม่ครบ — ปล่อยผ่าน ดีกว่าทำเว็บพังสำหรับ bot
  }

  try {
    const apiUrl =
      `${supabaseUrl}/rest/v1/lamb_devotion` +
      `?id=eq.${encodeURIComponent(devotionId)}` +
      `&is_public=eq.true` +
      `&select=title,content_html,image_urls`;

    const res = await fetch(apiUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!res.ok) return;

    const rows = (await res.json()) as Array<{
      title: string;
      content_html: string;
      image_urls: string[] | null;
    }>;
    const entry = rows[0];
    // ไม่เจอ (ลบไปแล้ว/id ผิด) หรือไม่ public — ปล่อยผ่านให้ SPA แสดงหน้า
    // "ไม่พบเฝ้าเดี่ยวนี้" ตามปกติ (usePublicLambDevotionDetail กรองซ้ำอยู่
    // แล้วฝั่ง client)
    if (!entry) return;

    const title = entry.title || "เฝ้าเดี่ยว";
    const description = stripHtml(entry.content_html || "").slice(0, 150);
    const image =
      entry.image_urls && entry.image_urls[0]
        ? entry.image_urls[0]
        : `${url.origin}/images/shadcn-admin.png`;

    const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url.href)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- crawler ไม่รัน JS/redirect เอง แต่เผื่อ bot ตัวไหนตามลิงก์จริงต่อ
    ก็ให้เด้งไป URL เดิม (ซึ่งจะเจอ SPA ตามปกติ) -->
    <meta http-equiv="refresh" content="0;url=${escapeHtml(url.href)}" />
  </head>
  <body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return; // ผิดพลาดอะไรก็ตาม (network ล่ม ฯลฯ) ปล่อยผ่านดีกว่าบล็อก
  }
}
