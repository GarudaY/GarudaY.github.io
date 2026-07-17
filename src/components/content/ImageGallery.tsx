import type { Locale } from "@/i18n/config";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { ContentImage } from "@/components/ui/ContentImage";

export function ImageGallery({
  images,
  locale,
}: {
  images: ImageAsset[];
  locale: Locale;
}) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {images.map((image, index) => (
        <figure
          key={`${image.src}-${index}`}
          className={cn(index === 0 && images.length > 2 && "sm:col-span-2")}
        >
          <ContentImage
            image={image}
            locale={locale}
            className={cn(
              "aspect-[4/3]",
              index === 0 && images.length > 2 && "sm:aspect-[16/8]",
            )}
            sizes={
              index === 0 && images.length > 2
                ? "(min-width: 1024px) 60vw, 100vw"
                : "(min-width: 1024px) 30vw, 100vw"
            }
          />
          {image.credit ? (
            <figcaption className="mt-2 text-xs text-ink-muted">
              {image.credit}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
