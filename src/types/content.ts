import type { Locale } from "@/i18n/config";

export type PublicationStatus = "draft" | "published" | "archived";
export type LocalizedString = Partial<Record<Locale, string>> & { uk: string };
export type LocalizedList = Partial<Record<Locale, string[]>> & {
  uk: string[];
};
export type LocalizedRichText = LocalizedList;

export type SEOData = {
  title: LocalizedString;
  description: LocalizedString;
  image?: string;
  noIndex?: boolean;
};

export type ImageAsset = {
  src: string;
  alt: LocalizedString;
  width?: number;
  height?: number;
  credit?: string;
};

export type SocialLink = {
  label: string;
  href: string;
  type: "instagram" | "facebook" | "telegram" | "youtube" | "email" | "website";
};

export type LegalLink = {
  label: LocalizedString;
  route: "impressum" | "privacy" | "cookies";
};

export type NavigationItem = {
  label: LocalizedString;
  route: "about" | "courses" | "events" | "news" | "donate" | "contact";
  priority: "primary" | "secondary";
};

export type ContactSettings = {
  email: string;
  phone: string;
  address: LocalizedString;
  officeHours: LocalizedString;
  mapNote: LocalizedString;
};

export type SiteSettings = {
  id: string;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  contact: ContactSettings;
  navigation: NavigationItem[];
  legalLinks: LegalLink[];
  socialLinks: SocialLink[];
  stats: Statistic[];
  seo: SEOData;
};

export type PersonRole = "board" | "team" | "teacher" | "volunteer";

export type Person = {
  id: string;
  slug: string;
  status: PublicationStatus;
  name: LocalizedString;
  roleLabel: LocalizedString;
  roles: PersonRole[];
  bio: LocalizedString;
  languages: string[];
  image: ImageAsset;
  email?: string;
  socialLinks?: SocialLink[];
  relatedCourseIds: string[];
  order: number;
  isDemo: boolean;
  seo: SEOData;
  createdAt: string;
  updatedAt: string;
};

export type CourseCategory =
  "language" | "children" | "culture" | "integration" | "creative";
export type CourseStatus = "open" | "waitlist" | "closed" | "planned";

export type CourseSchedule = {
  weekday: LocalizedString;
  time: string;
  cadence: LocalizedString;
};

export type Course = {
  id: string;
  slug: string;
  status: PublicationStatus;
  enrollmentStatus: CourseStatus;
  category: CourseCategory;
  title: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  outcomes: LocalizedList;
  materials: LocalizedList;
  ageGroup: LocalizedString;
  language: LocalizedString;
  format: LocalizedString;
  location: LocalizedString;
  schedule: CourseSchedule[];
  price: LocalizedString;
  startsAt: string;
  duration: LocalizedString;
  seatsTotal: number;
  seatsAvailable: number;
  teacherIds: string[];
  relatedCourseIds: string[];
  image: ImageAsset;
  isFeatured: boolean;
  order: number;
  seo: SEOData;
  createdAt: string;
  updatedAt: string;
};

export type EventStatus = "upcoming" | "past" | "cancelled";
export type EventCategory =
  "community" | "culture" | "children" | "integration" | "charity";

export type Event = {
  id: string;
  slug: string;
  status: PublicationStatus;
  eventStatus: EventStatus;
  category: EventCategory;
  title: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  startsAt: string;
  endsAt?: string;
  location: LocalizedString;
  price: LocalizedString;
  registrationLabel: LocalizedString;
  capacity: number;
  seatsAvailable: number;
  contactEmail: string;
  image: ImageAsset;
  gallery: ImageAsset[];
  relatedArticleIds: string[];
  relatedCourseIds: string[];
  isFeatured: boolean;
  seo: SEOData;
  createdAt: string;
  updatedAt: string;
};

export type NewsArticle = {
  id: string;
  slug: string;
  status: PublicationStatus;
  title: LocalizedString;
  excerpt: LocalizedString;
  body: LocalizedRichText;
  publishedAt: string;
  author: LocalizedString;
  image: ImageAsset;
  relatedEventIds: string[];
  relatedCourseIds: string[];
  isFeatured: boolean;
  seo: SEOData;
  createdAt: string;
  updatedAt: string;
};

export type Partner = {
  id: string;
  name: string;
  status: PublicationStatus;
  description: LocalizedString;
  website?: string;
  logo: ImageAsset;
  order: number;
};

export type DonationMethod = {
  id: string;
  type: "bank" | "paypal" | "qr" | "in-kind";
  title: LocalizedString;
  description: LocalizedString;
  details: LocalizedList;
  isDemo: boolean;
};

export type DonationSettings = {
  title: LocalizedString;
  description: LocalizedString;
  impact: LocalizedList;
  methods: DonationMethod[];
  seo: SEOData;
};

export type FeaturedContent = {
  id: string;
  type: "course" | "event" | "news" | "donation";
  title: LocalizedString;
  summary: LocalizedString;
  hrefRoute: "courses" | "events" | "news" | "donate";
  slug?: string;
  badge: LocalizedString;
};

export type Statistic = {
  id: string;
  value: string;
  label: LocalizedString;
  note?: LocalizedString;
};
