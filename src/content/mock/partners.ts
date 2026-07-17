import type { Partner } from "@/types/content";

export const partners: Partner[] = [
  {
    id: "partner-demo-city",
    name: "Demo Stadtteilzentrum",
    status: "published",
    description: {
      uk: "Вигаданий партнер для демонстрації логотипів і зв'язків.",
      de: "Fiktiver Partner zur Demonstration von Logos und Beziehungen.",
    },
    website: "https://example.com/partner-demo",
    logo: {
      src: "/images/partners/demo-stadtteilzentrum.svg",
      alt: { uk: "Логотип Demo Stadtteilzentrum", de: "Logo Demo Stadtteilzentrum" },
    },
    order: 1,
  },
  {
    id: "partner-demo-library",
    name: "Demo Bibliothek",
    status: "published",
    description: {
      uk: "Вигадана бібліотека для демонстрації партнерського блоку.",
      de: "Fiktive Bibliothek zur Demonstration des Partnerbereichs.",
    },
    website: "https://example.com/library-demo",
    logo: {
      src: "/images/partners/demo-bibliothek.svg",
      alt: { uk: "Логотип Demo Bibliothek", de: "Logo Demo Bibliothek" },
    },
    order: 2,
  },
  {
    id: "partner-demo-foundation",
    name: "Demo Stiftung",
    status: "published",
    description: {
      uk: "Вигадана фундація для перевірки layout.",
      de: "Fiktive Stiftung zum Prüfen des Layouts.",
    },
    website: "https://example.com/foundation-demo",
    logo: {
      src: "/images/partners/demo-stiftung.svg",
      alt: { uk: "Логотип Demo Stiftung", de: "Logo Demo Stiftung" },
    },
    order: 3,
  },
];
