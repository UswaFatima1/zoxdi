import type { Metadata } from "next";
import { DrillRunner } from "@/components/practice/DrillRunner";

export const metadata: Metadata = {
  title: "Drills — Zoxdi",
  description:
    "Five hundred practice questions across easy, medium, hard and expert tiers, derived from a real chart of accounts.",
};

export default function DrillsPage() {
  return <DrillRunner />;
}
