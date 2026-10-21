import { IdeaStage, ideaStages } from "../../domain/entities/IdeaStage";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";

export interface InnovationMetrics {
  totalIdeas: number;
  ideasByStage: Record<IdeaStage, number>;
  ideasByArea: Record<string, number>;
}

export class GetInnovationMetricsUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(): Promise<InnovationMetrics> {
    const ideas = await this.ideaRepository.findAll();
    const ideasByStage: Record<IdeaStage, number> = {
      IDEACAO: 0,
      ESCOPO: 0,
      PLANO_DE_NEGOCIOS: 0,
      DESENVOLVIMENTO: 0,
      TESTE_E_VALIDACAO: 0,
      LANCAMENTO: 0,
    };
    const ideasByArea = new Map<string, number>();

    for (const idea of ideas) {
      ideasByStage[idea.currentStage] += 1;

      // "department" é a chave usada pelo formulário de nova ideia do frontend
      const area = [
        idea.extraFields?.area,
        idea.extraFields?.departamento,
        idea.extraFields?.department,
      ].find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );
      const areaName = area?.trim() ?? "Não informado";

      ideasByArea.set(areaName, (ideasByArea.get(areaName) ?? 0) + 1);
    }

    return {
      totalIdeas: ideas.length,
      ideasByStage,
      ideasByArea: Object.fromEntries(ideasByArea),
    };
  }
}
