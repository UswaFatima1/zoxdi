/**
 * The shareable score card. It is drawn on a canvas in the browser, so a player
 * can save it or send it to any app without an image service or an upload.
 */

export interface CardData {
  name: string;
  avatar: string;
  /** The big line, for example "Level 12 mastered". */
  headline: string;
  /** The second line, usually the level title. */
  subline: string;
  xp: number;
  levels: number;
  streak: number;
  /** Printed at the bottom of the card, for example "zoxdi.pages.dev". */
  url: string;
}

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const CARD_FILE_NAME = "zoxdi-score.png";

const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function font(size: number, weight: number | string = 800): string {
  return `${weight} ${size}px ${FONT_STACK}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Shorten with an ellipsis so a long title never spills off the card. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}...`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}...`;
}

function brandGradient(ctx: CanvasRenderingContext2D, size: number): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#ffd93d");
  gradient.addColorStop(0.22, "#f58529");
  gradient.addColorStop(0.52, "#e1306c");
  gradient.addColorStop(0.78, "#9b30bf");
  gradient.addColorStop(1, "#405de6");
  return gradient;
}

export function drawScoreCard(canvas: HTMLCanvasElement, data: CardData): boolean {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const brand = brandGradient(ctx, CARD_WIDTH);
  ctx.fillStyle = brand;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // The dark panel the words sit on.
  roundRect(ctx, 48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96, 64);
  ctx.fillStyle = "#0b0f1a";
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Wordmark and what the site is.
  ctx.fillStyle = "#ffffff";
  ctx.font = font(52, 900);
  ctx.fillText("ZOXDI", CARD_WIDTH / 2, 196);
  ctx.font = font(28, 700);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("ACCOUNTING, TAUGHT AS A GAME", CARD_WIDTH / 2, 246);

  // Who earned it.
  ctx.font = font(124, 700);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(data.avatar || "\u{1F9FE}", CARD_WIDTH / 2, 410);
  ctx.font = font(64, 900);
  ctx.fillText(fit(ctx, data.name, CARD_WIDTH - 220), CARD_WIDTH / 2, 512);

  // What they did.
  ctx.font = font(42, 800);
  const headline = fit(ctx, data.headline, CARD_WIDTH - 340);
  const pillWidth = ctx.measureText(headline).width + 92;
  roundRect(ctx, (CARD_WIDTH - pillWidth) / 2, 556, pillWidth, 86, 43);
  ctx.fillStyle = brand;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(headline, CARD_WIDTH / 2, 614);

  ctx.font = font(56, 800);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fit(ctx, data.subline, CARD_WIDTH - 200), CARD_WIDTH / 2, 742);

  // The score.
  ctx.font = font(150, 900);
  ctx.fillStyle = brand;
  ctx.fillText(data.xp.toLocaleString("en-US"), CARD_WIDTH / 2, 906);
  ctx.font = font(40, 800);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.fillText("XP EARNED", CARD_WIDTH / 2, 960);

  // Two smaller numbers.
  const stats = [
    { value: String(data.levels), label: "LEVELS MASTERED", x: CARD_WIDTH / 2 - 210 },
    { value: String(data.streak), label: "DAY STREAK", x: CARD_WIDTH / 2 + 210 },
  ];
  for (const stat of stats) {
    ctx.font = font(66, 900);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(stat.value, stat.x, 1085);
    ctx.font = font(24, 700);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(stat.label, stat.x, 1122);
  }

  // Where to find it.
  ctx.font = font(42, 900);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(data.url, CARD_WIDTH / 2, 1214);
  ctx.font = font(30, 700);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("free, no ads - beat me if you can", CARD_WIDTH / 2, 1262);

  return true;
}

export async function cardBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob ?? null), "image/png");
    } catch {
      resolve(null);
    }
  });
}

/** Copy text, with a plain fallback for browsers that block the clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the old selection trick.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function downloadCard(canvas: HTMLCanvasElement, fileName = CARD_FILE_NAME): boolean {
  try {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch {
    return false;
  }
}

export type ShareOutcome = "shared" | "copied" | "failed";

function userCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function imageFile(canvas: HTMLCanvasElement): Promise<File | null> {
  if (typeof File !== "function") return null;
  const blob = await cardBlob(canvas);
  if (!blob) return null;
  try {
    return new File([blob], CARD_FILE_NAME, { type: "image/png" });
  } catch {
    return null;
  }
}

/**
 * Prefer the device share sheet, with the card image attached when the browser
 * allows it. Falls back to copying the message so the player can paste it.
 */
export async function shareScore(input: {
  canvas: HTMLCanvasElement | null;
  text: string;
  title: string;
}): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const file = input.canvas ? await imageFile(input.canvas) : null;
    const canShareFile = Boolean(
      file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }),
    );
    try {
      if (canShareFile && file) {
        await navigator.share({ files: [file], text: input.text, title: input.title });
      } else {
        await navigator.share({ text: input.text, title: input.title });
      }
      return "shared";
    } catch (error) {
      // The player closing the sheet is a success, not a failure.
      if (userCancelled(error)) return "shared";
    }
  }
  return (await copyText(input.text)) ? "copied" : "failed";
}
