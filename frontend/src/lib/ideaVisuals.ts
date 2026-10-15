import type { CSSProperties } from "react";
import type { Idea } from "../types";
import { stageIndex, STAGES } from "./gates";

/**
 * Stage weight — ideas further along the funnel read with slightly more
 * physical presence (whiter surface, a touch more shadow). Ideas sent back
 * for revision read slightly desaturated/quieter.
 */
export function presenceForIdea(idea: Idea): CSSProperties {
  const t = stageIndex(idea.stage) / (STAGES.length - 1); // 0..1
  const shadow = 1 + t * 2.2; // 1..3.2
  const stalled = idea.status === "Em revisão";
  return {
    boxShadow: `0 ${shadow}px ${shadow * 4}px rgba(0,0,0,${0.05 + t * 0.05})`,
    background: "#FFFFFF",
    filter: stalled ? "saturate(0.75)" : undefined,
    opacity: stalled ? 0.92 : 1,
  };
}

/**
 * Most recent movement date for an idea — the clock gate aging counts from.
 * Evaluations don't move the idea between gates, so they don't reset the clock.
 */
export function lastMovementDate(idea: Idea): Date {
  const moves = idea.timeline.filter((t) => t.decision !== "avaliada");
  if (moves.length === 0) return new Date(idea.submittedAt);
  return new Date(moves[moves.length - 1].date);
}

/** Days an idea has been sitting at its current stage awaiting a gate decision. */
export function daysWaiting(idea: Idea): number {
  const ms = Date.now() - lastMovementDate(idea).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function isAwaitingGate(idea: Idea): boolean {
  return idea.status === "Em andamento" || idea.status === "Em revisão";
}

/** The recorded justification for why a rejected idea was killed. */
export function rejectionFeedback(idea: Idea): string | null {
  if (idea.status !== "Rejeitada") return null;
  const entry = [...idea.timeline].reverse().find((t) => t.decision === "rejeitada");
  return entry?.feedback ?? null;
}

/** Warm, non-alarming aging tone — never reaches red. */
export function agingTone(days: number): { bg: string; color: string; label: string } {
  if (days < 5) return { bg: "#F0F0F2", color: "#6E6E73", label: `${days}d` };
  if (days < 12) return { bg: "#FEF3E2", color: "#B6790A", label: `${days}d` };
  if (days < 21) return { bg: "#FDE7C8", color: "#9A5B0A", label: `${days}d` };
  return { bg: "#FBD9AE", color: "#7A4308", label: `${days}d` };
}
