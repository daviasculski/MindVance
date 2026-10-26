import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IdeaOutputDTO, RequesterDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";
import { ListIdeasFiltersDTO } from "../dtos/ListIdeasFiltersDTO";

export class ListIdeasUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(filters: ListIdeasFiltersDTO, requester: RequesterDTO): Promise<IdeaOutputDTO[]> {
    // Matriz de permissões: só o Gestor vê todas as ideias (funil, triagem).
    // Os demais listam as próprias ideias ou as do Mural (Lançamento).
    const ownIdeas = filters.authorId === requester.id;
    const approvedBoard = filters.stage === "LANCAMENTO";
    if (requester.role !== "GATEKEEPER" && !ownIdeas && !approvedBoard) {
      throw new Error("Only the gatekeeper can list all ideas");
    }

    const ideas = await this.ideaRepository.findAll(filters);

    const authorIds = [...new Set(ideas.map((idea) => idea.authorId))];
    const authors = await this.userRepository.findByIds(authorIds);
    const nameById = new Map(authors.map((u) => [u.id, u.name]));

    return ideas.map((idea) =>
      toIdeaOutputDTO(idea, nameById.get(idea.authorId) ?? "Colaborador"),
    );
  }
}
