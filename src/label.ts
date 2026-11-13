import { Text } from "pixi.js";

// white text with a dark outline, readable over snakes and dots
export function makeLabel(text = "") {
  return new Text({
    text,
    style: {
      fill: 0xffffff,
      fontFamily: "monospace",
      fontWeight: "bold",
      align: "center",
    },
  });
}

export function sizeLabel(label: Text, fontSize: number) {
  label.style.fontSize = fontSize;
  label.style.stroke = { color: 0x1b1b24, width: fontSize * 0.3 };
}
