import Link from "next/link";
import {
  recommendationPresentation,
  type AdaptiveRecommendation,
} from "../application/adaptive-recommendation";

export function AdaptiveRecommendationCard({
  recommendation,
  actionClassName,
  className,
}: {
  recommendation: AdaptiveRecommendation;
  actionClassName?: string;
  className?: string;
}) {
  const view = recommendationPresentation(recommendation);
  return (
    <section className={className} aria-label="Следующая полезная задача">
      <h2>Следующая полезная задача</h2>
      <p>{view.reason}</p>
      <p>Это предложение для практики, а не оценка знаний.</p>
      <Link className={actionClassName} href={view.href}>
        {view.title}
      </Link>
    </section>
  );
}
