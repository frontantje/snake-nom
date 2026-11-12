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

type Shape = "square" | "circle" | "tile";
type Placeholder = { color: number; shape: Shape };

// placeholders, used when there's no src/sprites/<name>.png
export const ART = {
  hero: { color: 0xe8553e, shape: "square" },
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
  } else {
    if (shape === "square") g.rect(2, 3, 12, 12).fill(color);
    else g.circle(8, 9, 6.5).fill(color);
    g.rect(4, 6, 3, 3).rect(9, 6, 3, 3).fill(0xffffff);
    g.rect(5, 7, 2, 2).rect(10, 7, 2, 2).fill(0x000000);
  }
  return render(renderer, g);
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
