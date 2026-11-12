import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Renderer,
  Sprite,
  Texture,
} from "pixi.js";

// every picture is SIZE × SIZE art pixels
export const SIZE = 16;

type Shape = "square" | "circle" | "tile" | "head" | "ball" | "tail";
type Placeholder = { color: number; shape: Shape };

// placeholders, used when there's no src/sprites/<name>.png
// head and tail look to the right, the way the snake moves
export const ART = {
  head: { color: 0x6abe30, shape: "head" },
  body: { color: 0x6abe30, shape: "ball" },
  tail: { color: 0x6abe30, shape: "tail" },
} satisfies Record<string, Placeholder>;

export type ArtName = keyof typeof ART;

const spriteUrls = new Map(
  Object.entries(
    import.meta.glob<string>("./sprites/*.png", {
      eager: true,
      query: "?url",
      import: "default",
    }),
  ).map(([path, url]) => [
    path.slice("./sprites/".length, -".png".length).toLowerCase(),
    url,
  ]),
);

const textures = new Map<ArtName, Texture>();

export async function loadArt(renderer: Renderer) {
  for (const [name, placeholder] of Object.entries(ART) as [
    ArtName,
    Placeholder,
  ][]) {
    const url = spriteUrls.get(name.toLowerCase());
    const texture = url
      ? fitToSize(renderer, await Assets.load<Texture>(url))
      : drawPlaceholder(renderer, placeholder);
    texture.source.scaleMode = "nearest";
    textures.set(name, texture);
  }
}

export function art(name: ArtName): Texture {
  return textures.get(name) ?? Texture.WHITE;
}

// exports at 2x, 10x, ... are shrunk back to SIZE
function fitToSize(renderer: Renderer, texture: Texture) {
  if (texture.width === SIZE && texture.height === SIZE) return texture;
  texture.source.scaleMode = "nearest";
  const scale = SIZE / Math.max(texture.width, texture.height);
  const sprite = new Sprite(texture);
  sprite.scale.set(scale);
  sprite.position.set(
    (SIZE - texture.width * scale) / 2,
    SIZE - texture.height * scale,
  );
  const holder = new Container();
  holder.addChild(sprite);
  return render(renderer, holder);
}

function drawPlaceholder(renderer: Renderer, { color, shape }: Placeholder) {
  const g = new Graphics();
  if (shape === "tile") {
    g.rect(0, 0, SIZE, SIZE).fill(color);
    g.rect(0, SIZE - 1, SIZE, 1)
      .rect(SIZE - 1, 0, 1, SIZE - 1)
      .fill({ color: 0x000000, alpha: 0.12 });
  } else if (shape === "head") {
    outlined(color, (inset) => g.circle(8, 8, 7 - inset));
    g.rect(9, 3, 3, 4).rect(9, 9, 3, 4).fill(0xffffff);
    g.rect(10, 4, 2, 2).rect(10, 10, 2, 2).fill(0x000000);
  } else if (shape === "ball") {
    outlined(color, (inset) => g.circle(8, 8, 6 - inset));
    g.rect(5, 5, 2, 2).fill({ color: 0xffffff, alpha: 0.5 });
  } else if (shape === "tail") {
    outlined(color, (inset) =>
      g
        .circle(10, 8, 4 - inset)
        .poly([10, 4 + inset, 10, 12 - inset, 1 + 2 * inset, 8]),
    );
  } else {
    if (shape === "square") g.rect(2, 3, 12, 12).fill(color);
    else g.circle(8, 9, 6.5).fill(color);
    g.rect(4, 6, 3, 3).rect(9, 6, 3, 3).fill(0xffffff);
    g.rect(5, 7, 2, 2).rect(10, 7, 2, 2).fill(0x000000);
  }
  return render(renderer, g);
}

// a darker 1px rim keeps overlapping snake parts apart
function outlined(color: number, shape: (inset: number) => Graphics) {
  shape(0).fill(color);
  shape(0).fill({ color: 0x000000, alpha: 0.3 });
  shape(1).fill(color);
}

function render(renderer: Renderer, target: Container) {
  const texture = renderer.generateTexture({
    target,
    frame: new Rectangle(0, 0, SIZE, SIZE),
    resolution: 1,
    antialias: false,
  });
  target.destroy({ children: true });
  return texture;
}
