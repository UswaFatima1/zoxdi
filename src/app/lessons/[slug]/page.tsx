import { notFound } from "next/navigation";
import { ConceptLesson } from "@/components/learning/ConceptLesson";
import { LESSONS, LESSON_BY_SLUG } from "@/lib/learning/lessons";

export const dynamicParams = false;

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = LESSON_BY_SLUG[slug];
  if (!lesson) return { title: "Lesson — Zoxdi" };
  return {
    title: `${lesson.title} — Zoxdi`,
    description: `${lesson.eyebrow}. ${lesson.tagline}`,
  };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = LESSON_BY_SLUG[slug];
  if (!lesson) notFound();
  return <ConceptLesson lesson={lesson} />;
}
