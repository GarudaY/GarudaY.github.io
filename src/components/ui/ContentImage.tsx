import Image from "next/image";
import type { ImageAsset } from "@/types/content";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { t } from "@/lib/localize";

type ContentImageProps = {
  image: ImageAsset;
  locale: Locale;
  className?: string;
  preload?: boolean;
  eager?: boolean;
  sizes?: string;
};

export function ContentImage({
  image,
  locale,
  className,
  preload,
  eager,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: ContentImageProps) {
  return (
    <div
      className={cn(
        "media-frame relative overflow-hidden rounded-[16px] bg-surface-muted",
        className,
      )}
    >
      <Image
        src={image.src}
        alt={t(image.alt, locale)}
        fill
        preload={preload}
        loading={preload ? undefined : eager ? "eager" : undefined}
        quality={82}
        sizes={sizes}
        className="select-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
      />
    </div>
  );
}
