export type CouplePhoto = { src: string; width: number; height: number }

// D-17: set when the owner provides the photo (put the file in public/, e.g. /jariya-et-son-mari.jpg).
// Until then nothing is rendered (no placeholder, no fake visual).
export const COUPLE_PHOTO: CouplePhoto | null = null
