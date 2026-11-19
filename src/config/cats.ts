import catFiles from 'virtual:cat-manifest';

export type Cat = {
  id: string;
  name: string;
  src: string;
  aspectRatio: number;
};

const NAMES = ['Mochi', 'Milo', 'Luna', 'Biscuit', 'Cosmo', 'Nori', 'Pepper', 'Suki'];
const FALLBACK_ASPECT_RATIO = 1312 / 1199;

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

export async function preloadCats(): Promise<Cat[]> {
  await Promise.all(
    CATS.map(
      (cat) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.decoding = 'async';
          image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              cat.aspectRatio = image.naturalWidth / image.naturalHeight;
            }
            resolve();
          };
          image.onerror = () => resolve();
          image.src = cat.src;
        }),
    ),
  );

  return CATS;
}
