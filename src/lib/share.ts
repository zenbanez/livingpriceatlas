import type { SpecId } from './specsCatalog';

export const CANONICAL_ORIGIN = 'https://livingpriceatlas.banezglobal.com';

export function buildShareUrl(specId: SpecId, sectionId?: string): string {
  if (!sectionId && specId === 'LPA001') {
    return `${CANONICAL_ORIGIN}/`;
  }
  const base = `${CANONICAL_ORIGIN}/?spec=${specId}`;
  return sectionId ? `${base}#${sectionId}` : base;
}

export interface SocialShareLinks {
  linkedIn: string;
  facebook: string;
  x: string;
}

export function buildSocialShareLinks(url: string, title: string): SocialShareLinks {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    linkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'unavailable';

export async function shareOrCopy(params: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed';
      }
      // Fall through to clipboard copy if navigator.share rejected outside user cancel
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(params.url);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }

  return 'unavailable';
}
