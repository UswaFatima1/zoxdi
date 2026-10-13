import { LEVELS } from "@/data/accounting";
import { LevelPlayer } from "@/components/game/LevelPlayer";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEVELS.map((level) => ({ levelId: level.id }));
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  return <LevelPlayer levelId={levelId} />;
}
