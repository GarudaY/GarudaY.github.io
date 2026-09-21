import { getCoursesForBuild } from "@/server/cms-courses";
import { locales } from "@/i18n/config";

export async function getStaticCourseParams() {
  const courses = await getCoursesForBuild();
  return locales.flatMap((locale) =>
    courses.map((course) => ({ locale, slug: course.slug })),
  );
}
