type VideoType = 'youtube' | 'vimeo' | 'rutube' | 'mp4' | 'unknown';

interface VideoInfo {
  type: VideoType;
  embedUrl?: string;
  directUrl?: string;
}

export function parseVideoUrl(url: string): VideoInfo {
  if (!url) return { type: 'unknown' };

  const rutubeRegex = /rutube\.ru\/(?:video\/(?:private\/)?|play\/embed\/)([a-f0-9]{32})/i;
  const rutubeMatch = url.match(rutubeRegex);
  if (rutubeMatch) {
    const id = rutubeMatch[1];
    let token: string | null = null;
    try {
      token = new URL(url).searchParams.get('p');
    } catch {
      token = null;
    }
    const embedUrl = token
      ? `https://rutube.ru/play/embed/${id}?p=${token}`
      : `https://rutube.ru/play/embed/${id}`;
    return { type: 'rutube', embedUrl };
  }

  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(youtubeRegex);
  if (ytMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return { type: 'mp4', directUrl: url };
  }

  return { type: 'unknown', directUrl: url };
}
