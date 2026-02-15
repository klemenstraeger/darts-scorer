/**
 * SVG dartboard geometry: segment paths, coordinate mapping, colors.
 *
 * Coordinate system: center of board at (200, 200) in a 400×400 viewBox.
 * All radii are scaled from BDO standard mm to SVG units.
 */

// Segment order clockwise from top (0° = 12 o'clock)
export const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const

// BDO standard radii in mm
const MM = {
  doubleBull: 6.35,
  singleBull: 15.9,
  innerSingleOuter: 99,
  trebleInner: 99,
  trebleOuter: 107,
  outerSingleOuter: 162,
  doubleInner: 162,
  doubleOuter: 170,
}

// SVG scale: 170mm → 190 SVG units (leaving 10 unit margin)
const SCALE = 190 / MM.doubleOuter
const CX = 200
const CY = 200

// Scaled radii
export const R = {
  doubleBull: MM.doubleBull * SCALE,
  singleBull: MM.singleBull * SCALE,
  innerSingleOuter: MM.innerSingleOuter * SCALE,
  trebleOuter: MM.trebleOuter * SCALE,
  outerSingleOuter: MM.outerSingleOuter * SCALE,
  doubleOuter: MM.doubleOuter * SCALE,
}

const SEGMENT_ANGLE = 360 / 20 // 18°

// Colors
export const COLORS = {
  red: '#E8113A',
  green: '#009B48',
  cream: '#F5E6C8',
  black: '#1A1A1A',
  bullGreen: '#009B48',
  bullRed: '#E8113A',
  wire: '#C0C0C0',
  bg: '#2D2D2D',
  numberText: '#FFFFFF',
}

export type RingType = 'double' | 'outerSingle' | 'treble' | 'innerSingle'

function polarToCartesian(r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

/**
 * Generate SVG path for an annular sector (ring segment).
 */
function arcPath(innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  const [ox1, oy1] = polarToCartesian(outerR, startAngle)
  const [ox2, oy2] = polarToCartesian(outerR, endAngle)
  const [ix2, iy2] = polarToCartesian(innerR, endAngle)
  const [ix1, iy1] = polarToCartesian(innerR, startAngle)

  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}

export interface SegmentPath {
  segment: number
  ring: RingType
  multiplier: 1 | 2 | 3
  path: string
  color: string
}

/**
 * Get the fill color for a segment based on its index and ring type.
 */
function segmentColor(segIndex: number, ring: RingType): string {
  const isEven = segIndex % 2 === 0
  switch (ring) {
    case 'double':
    case 'treble':
      return isEven ? COLORS.red : COLORS.green
    case 'outerSingle':
    case 'innerSingle':
      return isEven ? COLORS.cream : COLORS.black
  }
}

/**
 * Generate all segment paths for the dartboard.
 */
export function generateSegmentPaths(): SegmentPath[] {
  const paths: SegmentPath[] = []

  const rings: { ring: RingType; inner: number; outer: number; mult: 1 | 2 | 3 }[] = [
    { ring: 'double', inner: R.outerSingleOuter, outer: R.doubleOuter, mult: 2 },
    { ring: 'outerSingle', inner: R.trebleOuter, outer: R.outerSingleOuter, mult: 1 },
    { ring: 'treble', inner: R.innerSingleOuter, outer: R.trebleOuter, mult: 3 },
    { ring: 'innerSingle', inner: R.singleBull, outer: R.innerSingleOuter, mult: 1 },
  ]

  for (let i = 0; i < 20; i++) {
    const startAngle = i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2
    const endAngle = startAngle + SEGMENT_ANGLE
    const segment = SEGMENT_ORDER[i]

    for (const { ring, inner, outer, mult } of rings) {
      paths.push({
        segment,
        ring,
        multiplier: mult,
        path: arcPath(inner, outer, startAngle, endAngle),
        color: segmentColor(i, ring),
      })
    }
  }

  return paths
}

/**
 * Generate number label positions (outside the double ring).
 */
export function generateNumberPositions(): { segment: number; x: number; y: number }[] {
  const labelR = R.doubleOuter + 14
  return SEGMENT_ORDER.map((segment, i) => {
    const angle = i * SEGMENT_ANGLE
    const [x, y] = polarToCartesian(labelR, angle)
    return { segment, x, y }
  })
}

/**
 * Determine the segment and multiplier from SVG click coordinates.
 * Used for manual score entry by clicking the dartboard.
 */
export function svgToScore(svgX: number, svgY: number): { segment: number; multiplier: 1 | 2 | 3 } {
  const dx = svgX - CX
  const dy = svgY - CY
  const radius = Math.sqrt(dx * dx + dy * dy)

  // Bull zones
  if (radius <= R.doubleBull) return { segment: 25, multiplier: 2 }
  if (radius <= R.singleBull) return { segment: 25, multiplier: 1 }
  if (radius > R.doubleOuter) return { segment: 0, multiplier: 1 }

  // Angle: 0° at top, clockwise
  let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
  if (angle < 0) angle += 360

  const offsetAngle = (angle + SEGMENT_ANGLE / 2) % 360
  const segIndex = Math.floor(offsetAngle / SEGMENT_ANGLE)
  const segment = SEGMENT_ORDER[segIndex]

  // Ring
  let multiplier: 1 | 2 | 3 = 1
  if (radius <= R.innerSingleOuter) multiplier = 1
  else if (radius <= R.trebleOuter) multiplier = 3
  else if (radius <= R.outerSingleOuter) multiplier = 1
  else multiplier = 2

  return { segment, multiplier }
}

export { CX, CY }
