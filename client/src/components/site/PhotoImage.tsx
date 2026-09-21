import type { Photo } from "@/config/photos";
import { cn } from "@/lib/cn";

interface PhotoImageProps {
  photo: Photo;
  className?: string;
  /** Above-the-fold image: load immediately and at high priority. Everything else is lazy. */
  priority?: boolean;
}

/** A cropped, cover-fitted photograph that keeps its subject in frame. Fills its (sized) parent. */
export function PhotoImage({ photo, className, priority = false }: PhotoImageProps) {
  return (
    <img
      src={photo.src}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={{ objectPosition: photo.focal }}
      className={cn("size-full object-cover", className)}
    />
  );
}
