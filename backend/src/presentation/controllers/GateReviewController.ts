import { Request, Response } from "express";
import { AssignEvaluatorsUserStory } from "../../application/userstories/AssignEvaluatorsUserStory";
import { DecideGateUserStory } from "../../application/userstories/DecideGateUserStory";
import { GateReviewQueriesUserStory } from "../../application/userstories/GateReviewQueriesUserStory";
import { OpenGateReviewUserStory } from "../../application/userstories/OpenGateReviewUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  // 400: dados inválidos
  "Select at least one evaluator": 400,
  "Only approved evaluators can be designated": 400,
  "The idea author cannot be designated as evaluator": 400,
  "Invalid gate review status": 400,
  "Decision must be APROVADA, REJEITADA or REVISAO": 400,
  "Feedback is required to decide a gate": 400,
  "Review points must be a list of texts": 400,
  // 403: perfil sem permissão
  "Only the gatekeeper opens Gate 1 after triage": 403,
  "Only the author can request a gate review": 403,
  "Only the gatekeeper designates evaluators": 403,
  "Only gatekeepers can decide gates": 403,
  // 404
  "Idea not found": 404,
  "Gate review not found": 404,
  "Gate not found": 404,
  // 409: a ideia ou a rodada não está no estado certo
  "Idea is in the final stage and has no gate to review": 409,
  "Idea cannot request a gate review in its current status": 409,
  "Evaluators were already designated for this round": 409,
  "Gate review is not awaiting a decision": 409,
};

export class GateReviewController {
  constructor(
    private readonly openGateReview: OpenGateReviewUserStory,
    private readonly assignEvaluators: AssignEvaluatorsUserStory,
    private readonly decideGate: DecideGateUserStory,
    private readonly queries: GateReviewQueriesUserStory,
  ) {}

  /** POST /ideas/:id/gate-reviews — Gestor abre o G1 (triagem) ou autor solicita revisão */
  async open(req: Request, res: Response): Promise<Response> {
    try {
      const output = await this.openGateReview.execute(req.params.id, {
        id: req.user!.id,
        role: req.user!.role,
      });
      return res.status(201).json(output);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to open gate review");
    }
  }

  /** POST /gate-reviews/:id/evaluators — Gestor designa os avaliadores */
  async assign(req: Request, res: Response): Promise<Response> {
    try {
      const output = await this.assignEvaluators.execute(req.params.id, req.body?.evaluatorIds, {
        id: req.user!.id,
        role: req.user!.role,
      });
      return res.status(200).json(output);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to designate evaluators");
    }
  }

  /** POST /gate-reviews/:id/decision — Gestor decide a rodada */
  async decide(req: Request, res: Response): Promise<Response> {
    try {
      const { decision, feedback, reviewPoints } = req.body ?? {};
      const output = await this.decideGate.execute({
        reviewId: req.params.id,
        deciderId: req.user!.id,
        deciderRole: req.user!.role,
        decision,
        feedback,
        reviewPoints,
      });
      return res.status(201).json(output);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to decide gate");
    }
  }

  /** GET /gate-reviews?status= — filas do Gestor */
  async list(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.queries.listByStatus(req.query.status));
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to list gate reviews");
    }
  }

  /** GET /gate-reviews/:id — rodada com os pareceres, para a decisão */
  async detail(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.queries.detail(req.params.id));
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to load gate review");
    }
  }

  /** GET /gates — gates, critérios, pesos e limites de recomendação */
  async gates(_req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.queries.listGates());
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to list gates");
    }
  }
}
