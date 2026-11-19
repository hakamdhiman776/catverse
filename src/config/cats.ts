import catFiles from 'virtual:cat-manifest';

export type Cat = {
  id: string;
  name: string;
  src: string;
  aspectRatio: number;
};

const NAMES = ['Mochi', 'Milo', 'Luna', 'Biscuit', 'Cosmo', 'Nori', 'Pepper', 'Suki'];
const FALLBACK_ASPECT_RATIO = 1312 / 1199;

const imageCache = new Map<string, HTMLImageElement>();
const readyImages = new Set<string>();
let preloadPromise: Promise<Cat[]> | null = null;

const toId = (file: string): string => file.replace(/\.[^.]+$/, '');

const toIndex = (id: string): number => {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

function buildCat(file: string, position: number): Cat {
  const id = toId(file);
  const index = toIndex(id);

  return {
    id,
    name: NAMES[index - 1] ?? `Cat ${position + 1}`,
    src: `/cats/${file}`,
    aspectRatio: FALLBACK_ASPECT_RATIO,
  };
}

export const CATS: Cat[] =
  catFiles.length > 0
    ? catFiles.map(buildCat)
    : [
        {
          id: 'cat-01',
          name: 'Mochi',
          src: '/cats/cat-01.png',
          aspectRatio: FALLBACK_ASPECT_RATIO,
        },
      ];

export function isCatReady(src: string): boolean {
  return readyImages.has(src);
}

export function getCachedCatImage(src: string): HTMLImageElement | undefined {
  return imageCache.get(src);
}

function waitForLoad(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
  });
}

async function decodeImage(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode === 'function') {
    try {
      await image.decode();
      return;
    } catch {
      await waitForLoad(image);
      return;
    }
  }

  await waitForLoad(image);
}

async function loadAllCats(): Promise<Cat[]> {
  await Promise.all(
    CATS.map(async (cat) => {
      if (readyImages.has(cat.src)) return;

      let image = imageCache.get(cat.src);
      if (!image) {
        image = new Image();
        image.decoding = 'async';
        image.src = cat.src;
        imageCache.set(cat.src, image);
      }

      await decodeImage(image);

      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        cat.aspectRatio = image.naturalWidth / image.naturalHeight;
        readyImages.add(cat.src);
      }
    }),
  );

  return CATS;
}

export function preloadCats(): Promise<Cat[]> {
  if (!preloadPromise) preloadPromise = loadAllCats();
  return preloadPromise;
}

preloadCats();
