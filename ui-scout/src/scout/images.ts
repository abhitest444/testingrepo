import type { Page } from '@playwright/test';
import type { ScoutIssue } from './types';

export type ImageDefect = {
  kind: 'broken' | 'stretched' | 'upscaled' | 'missing-alt' | 'zero-size' | 'attr-mismatch';
  severity: ScoutIssue['severity'];
  message: string;
  src: string;
  details: string;
  selector?: string;
};

export type ScannedImage = {
  src: string;
  alt: string;
  ariaHidden: boolean;
  role: string | null;
  complete: boolean;
  loading: string | null;
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  attrWidth: number | null;
  attrHeight: number | null;
  inViewport: boolean;
  hiddenByAncestor: boolean;
};

export type ImageScanOptions = {
  /** Aspect-ratio delta above this flags stretched images (0–1). */
  stretchThreshold?: number;
  /** Display/natural ratio above this flags upscaled (pixelated) images. */
  upscaleThreshold?: number;
  /** Min displayed area (px²) before missing-alt is reported. */
  minAltArea?: number;
  /** Max edge length (px) for avatar/icon alt checks — smaller visible imgs skipped. */
  maxIconEdge?: number;
};

const DEFAULTS: Required<ImageScanOptions> = {
  stretchThreshold: 0.18,
  upscaleThreshold: 1.35,
  minAltArea: 8_000,
  maxIconEdge: 132,
};

/** WordPress / CMS lazy placeholders and srcset siblings — not user-visible defects. */
const LAZY_THUMB_SRC = /-\d{2,4}x\d{2,4}(\.[a-z]+)?(?:[?#]|$)/i;

function aspectRatio(width: number, height: number): number {
  return height === 0 ? 0 : width / height;
}

function isLazyPlaceholderSrc(src: string): boolean {
  return LAZY_THUMB_SRC.test(src);
}

/**
 * Ignore images that are hidden, off-screen, lazy placeholders, or still loading.
 */
export function shouldIncludeImage(img: ScannedImage): boolean {
  if (img.hiddenByAncestor) return false;
  if (img.ariaHidden || img.role === 'presentation') return false;

  const zeroDisplay = img.displayWidth <= 0 || img.displayHeight <= 0;

  if (zeroDisplay) {
    if (!img.inViewport) return false;
    if (img.loading === 'lazy') return false;
    if (!img.complete) return false;
    if (isLazyPlaceholderSrc(img.src)) return false;
    // Zero-size but in viewport — keep only if it looks like meaningful content (named logo etc.)
    if (!img.alt.trim()) return false;
  }

  return true;
}

/** HTML width/height often reserve aspect ratio while CSS scales — skip uniform downscales. */
export function isAttrSizeMismatch(
  attrWidth: number,
  attrHeight: number,
  displayWidth: number,
  displayHeight: number,
): boolean {
  const attrAR = aspectRatio(attrWidth, attrHeight);
  const displayAR = aspectRatio(displayWidth, displayHeight);
  if (attrAR === 0 || displayAR === 0) return false;

  const arDrift = Math.abs(attrAR - displayAR) / Math.max(attrAR, displayAR);
  if (arDrift > 0.06) return true;

  const scaleW = displayWidth / attrWidth;
  const scaleH = displayHeight / attrHeight;
  const uniform = Math.abs(scaleW - scaleH) / Math.max(scaleW, scaleH);
  return uniform > 0.12;
}

export function classifyImageDefects(
  images: ScannedImage[],
  options: ImageScanOptions = {},
): ImageDefect[] {
  const cfg = { ...DEFAULTS, ...options };
  const defects: ImageDefect[] = [];

  for (const img of images) {
    if (!shouldIncludeImage(img)) continue;

    const shortSrc = img.src.slice(0, 180);
    const selector = img.alt ? `img[alt="${img.alt.slice(0, 40)}"]` : undefined;

    if (img.displayWidth <= 0 || img.displayHeight <= 0) {
      if (img.src && !img.src.startsWith('data:')) {
        defects.push({
          kind: 'zero-size',
          severity: 'moderate',
          message: 'Visible image rendered with zero size',
          src: shortSrc,
          details: `display ${Math.round(img.displayWidth)}×${Math.round(img.displayHeight)} alt="${img.alt}"`,
          selector,
        });
      }
      continue;
    }

    if (img.complete && img.naturalWidth === 0) {
      defects.push({
        kind: 'broken',
        severity: 'serious',
        message: 'Broken or failed to load image',
        src: shortSrc,
        details: img.alt ? `alt="${img.alt}"` : '(no alt)',
        selector,
      });
      continue;
    }

    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const naturalAR = aspectRatio(img.naturalWidth, img.naturalHeight);
      const displayAR = aspectRatio(img.displayWidth, img.displayHeight);
      const stretchDelta =
        naturalAR === 0 || displayAR === 0
          ? 0
          : Math.abs(naturalAR - displayAR) / Math.max(naturalAR, displayAR);

      if (stretchDelta > cfg.stretchThreshold) {
        defects.push({
          kind: 'stretched',
          severity: 'moderate',
          message: 'Image appears stretched or squashed',
          src: shortSrc,
          details: `natural ${img.naturalWidth}×${img.naturalHeight} shown as ${Math.round(img.displayWidth)}×${Math.round(img.displayHeight)}`,
          selector,
        });
      }

      const scaleW = img.displayWidth / img.naturalWidth;
      const scaleH = img.displayHeight / img.naturalHeight;
      const maxScale = Math.max(scaleW, scaleH);
      if (maxScale > cfg.upscaleThreshold && img.naturalWidth < 256) {
        defects.push({
          kind: 'upscaled',
          severity: 'moderate',
          message: 'Low-resolution image upscaled (may look pixelated)',
          src: shortSrc,
          details: `${img.naturalWidth}×${img.naturalHeight} → ${Math.round(img.displayWidth)}×${Math.round(img.displayHeight)} (${maxScale.toFixed(1)}×)`,
          selector,
        });
      }

      if (img.attrWidth && img.attrHeight) {
        if (
          isAttrSizeMismatch(
            img.attrWidth,
            img.attrHeight,
            img.displayWidth,
            img.displayHeight,
          )
        ) {
          defects.push({
            kind: 'attr-mismatch',
            severity: 'minor',
            message: 'Image width/height attributes distort rendered aspect ratio',
            src: shortSrc,
            details: `attrs ${img.attrWidth}×${img.attrHeight} vs display ${Math.round(img.displayWidth)}×${Math.round(img.displayHeight)}`,
            selector,
          });
        }
      }
    }

    const w = img.displayWidth;
    const h = img.displayHeight;
    const area = w * h;
    const decorative = img.role === 'presentation' || img.ariaHidden;
    const isSmallIcon = w <= cfg.maxIconEdge && h <= cfg.maxIconEdge;

    if (!decorative && !img.alt.trim() && area >= cfg.minAltArea && !isSmallIcon) {
      defects.push({
        kind: 'missing-alt',
        severity: 'moderate',
        message: 'Content image missing alt text',
        src: shortSrc,
        details: `${Math.round(w)}×${Math.round(h)}px`,
        selector,
      });
    }
  }

  return defects.slice(0, 25);
}

export function imageDefectsToIssues(pageUrl: string, defects: ImageDefect[]): ScoutIssue[] {
  return defects.map((d) => ({
    category: 'broken-image' as const,
    severity: d.severity,
    message: d.message,
    url: pageUrl,
    details: `${d.details} · ${d.src}`,
    selector: d.selector,
  }));
}

/**
 * Image quality checks: broken, stretched, upscaled, missing alt, zero-size.
 * Skips off-screen, lazy, and hidden thumbnail noise.
 */
export async function scanPageImages(page: Page, options?: ImageScanOptions): Promise<ScoutIssue[]> {
  const images = await page.evaluate(() => {
    function hiddenByAncestor(el: Element): boolean {
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        const s = window.getComputedStyle(node);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    function intersectsViewport(rect: DOMRect): boolean {
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
    }

    return Array.from(document.images)
      .map((img) => {
        const style = window.getComputedStyle(img);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return null;
        }

        const rect = img.getBoundingClientRect();
        const attrWidth = img.getAttribute('width');
        const attrHeight = img.getAttribute('height');

        return {
          src: img.currentSrc || img.src,
          alt: img.alt || '',
          ariaHidden: img.getAttribute('aria-hidden') === 'true',
          role: img.getAttribute('role'),
          complete: img.complete,
          loading: img.getAttribute('loading'),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: rect.width,
          displayHeight: rect.height,
          attrWidth: attrWidth ? Number(attrWidth) : null,
          attrHeight: attrHeight ? Number(attrHeight) : null,
          inViewport: intersectsViewport(rect),
          hiddenByAncestor: hiddenByAncestor(img),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  });

  const defects = classifyImageDefects(images, options);
  return imageDefectsToIssues(page.url(), defects);
}
