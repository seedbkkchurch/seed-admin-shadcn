// ดึง video ID 11 ตัวจากลิงก์ YouTube ทุกรูปแบบที่คนมักวาง:
// youtube.com/watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID, /live/ID,
// music.youtube.com/watch?v=ID หรือวาง ID มาตรงๆ
export function parseYoutubeId(input: string): string | null {
  const text = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;

  let url: URL;
  try {
    url = new URL(text.startsWith("http") ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ??
      null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function youtubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

// ชื่อเพลง/ช่องจาก oEmbed — ช่วยเติมฟอร์มให้อัตโนมัติ ล้มเหลวก็แค่ให้แอดมิน
// พิมพ์เอง (บางเบราว์เซอร์/เครือข่ายบล็อก CORS ของ youtube.com จึงลอง
// noembed.com เป็นทางสำรอง)
export async function fetchYoutubeMeta(
  id: string,
): Promise<{ title: string; author: string | null } | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const endpoints = [
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`,
    `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`,
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const json = (await res.json()) as {
        title?: string;
        author_name?: string;
        error?: string;
      };
      if (json.title && !json.error) {
        return { title: json.title, author: json.author_name ?? null };
      }
    } catch {
      // ลองตัวถัดไป
    }
  }
  return null;
}
