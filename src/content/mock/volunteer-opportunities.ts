import type { VolunteerOpportunity } from "@/types/content";

export const volunteerOpportunities: VolunteerOpportunity[] = [
  {
    id: "events",
    icon: "calendar",
    title: { uk: "Допомога на подіях", de: "Mithilfe bei Veranstaltungen" },
    description: {
      uk: "Зустрічати гостей, готувати простір і допомагати команді в день події. Підійде, якщо любите живе спілкування та командну роботу.",
      de: "Gäste begrüßen, Räume vorbereiten und das Team am Veranstaltungstag unterstützen. Für Menschen, die gern anpacken und mit anderen zusammenarbeiten.",
    },
    time: { uk: "Кілька годин у день події", de: "Einige Stunden am Veranstaltungstag" },
    location: { uk: "Мьонхенгладбах", de: "Mönchengladbach" },
    order: 10,
  },
  {
    id: "media",
    icon: "camera",
    title: { uk: "Фото, відео та соцмережі", de: "Fotos, Videos und Social Media" },
    description: {
      uk: "Знімати моменти з життя спільноти, монтувати короткі відео або готувати дописи. Допоможіть більше розповідати про нашу роботу.",
      de: "Momente aus dem Vereinsleben festhalten, kurze Videos schneiden oder Beiträge gestalten. Helfen Sie mit, unsere Arbeit sichtbar zu machen.",
    },
    time: { uk: "Гнучко, за домовленістю", de: "Flexibel nach Absprache" },
    location: { uk: "На місці або онлайн", de: "Vor Ort oder online" },
    order: 20,
  },
  {
    id: "translation",
    icon: "languages",
    title: { uk: "Тексти й переклади UA / DE", de: "Texte und Übersetzungen UA / DE" },
    description: {
      uk: "Перекладати короткі анонси, вичитувати тексти та робити інформацію зрозумілою двома мовами. Стане в пригоді впевнена українська й німецька.",
      de: "Kurze Ankündigungen übersetzen, Texte gegenlesen und Informationen in beiden Sprachen verständlich machen. Gute Ukrainisch- und Deutschkenntnisse sind hilfreich.",
    },
    time: { uk: "Невеликі окремі завдання", de: "Kleine, einzelne Aufgaben" },
    location: { uk: "Можна дистанційно", de: "Auch von zu Hause" },
    order: 30,
  },
  {
    id: "projects",
    icon: "list",
    title: { uk: "Організація спільних проєктів", de: "Organisation gemeinsamer Projekte" },
    description: {
      uk: "Допомагати зі списками матеріалів, розкладом і домовленостями. Підійде тим, хто любить порядок і хоче доводити ідеї до результату.",
      de: "Materiallisten, Zeitpläne und Absprachen unterstützen. Für Menschen, die gern den Überblick behalten und Ideen Schritt für Schritt umsetzen.",
    },
    time: { uk: "Регулярно або на один проєкт", de: "Regelmäßig oder für ein Projekt" },
    location: { uk: "Гібридний формат", de: "Vor Ort und online" },
    order: 40,
  },
];
