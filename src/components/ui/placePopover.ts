/**
 * @file Anchored popover placement (port spec §4.6).
 */

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverPlacement {
  left: number;
  top: number;
  /** Set only when the popover fits neither below nor above. */
  maxHeight?: number;
}

/**
 * Places a popover of `size` below the anchor's bottom-left (+`gap`). It moves
 * left to stay `padding` inside the right edge, flips above when it does not
 * fit below but fits above, and otherwise takes the larger side with its
 * height capped.
 */
export function placePopover(
  anchor: Frame,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  padding = 10,
  gap = 4,
): PopoverPlacement {
  let left = anchor.x;
  if (left + size.width > viewport.width - padding) {
    left = viewport.width - padding - size.width;
  }
  left = Math.max(padding, left);

  const below = anchor.y + anchor.height + gap;
  const spaceBelow = viewport.height - padding - below;
  if (size.height <= spaceBelow) return { left, top: below };

  const spaceAbove = anchor.y - gap - padding;
  if (size.height <= spaceAbove) {
    return { left, top: anchor.y - gap - size.height };
  }
  return spaceAbove > spaceBelow
    ? { left, top: padding, maxHeight: spaceAbove }
    : { left, top: below, maxHeight: spaceBelow };
}
