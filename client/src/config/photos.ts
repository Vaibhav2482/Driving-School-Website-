import confidence from "@/assets/photos/confidence.jpg";
import gents from "@/assets/photos/gents.jpg";
import handsWheel from "@/assets/photos/hands-wheel.jpg";
import heroRoad from "@/assets/photos/hero-road.jpg";
import ladies from "@/assets/photos/ladies.jpg";
import lesson from "@/assets/photos/lesson.jpg";
import mirror from "@/assets/photos/mirror.jpg";
import rtaGuidance from "@/assets/photos/rta-guidance.jpg";
import sunsetDrive from "@/assets/photos/sunset-drive.jpg";

/**
 * Website photography. These are royalty-free STOCK photographs (Unsplash licence, free for commercial use)
 * used for atmosphere only. They are NOT photos of Sri Sai Balaji's own cars, instructors or learners, and
 * no caption or text on the site says they are. Replace them with the school's own photographs as soon as
 * they are available: keep the same key, drop the new file into `src/assets/photos/`, and update the import.
 *
 * `focal` is the CSS object-position that keeps the subject in frame when the image is cropped.
 */
export interface Photo {
  src: string;
  /** Decorative by default: the text beside each photo carries the meaning. */
  alt: string;
  focal?: string;
}

const decorative = (src: string, focal?: string): Photo => ({ src, alt: "", focal });

export const photos = {
  /** Sunset city road seen through a windscreen. Full-bleed hero. */
  hero: decorative(heroRoad, "50% 62%"),
  /** Golden-hour road. Closing call-to-action background. */
  sunset: decorative(sunsetDrive, "50% 60%"),
  hands: decorative(handsWheel, "50% 60%"),
  ladies: decorative(ladies, "50% 40%"),
  gents: decorative(gents, "60% 45%"),
  lesson: decorative(lesson, "50% 40%"),
  rta: decorative(rtaGuidance, "50% 50%"),
  confidence: decorative(confidence, "50% 40%"),
  mirror: decorative(mirror, "40% 40%"),
} satisfies Record<string, Photo>;
