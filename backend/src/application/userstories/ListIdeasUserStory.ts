import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IdeaOutputDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";
import { ListIdeasFiltersDTO } from "../dtos/ListIdeasFiltersDTO";

export class ListIdeasUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(filters?: ListIdeasFiltersDTO): Promise<IdeaOutputDTO[]> {
    const ideas = await this.ideaRepository.findAll(filters);

    const authorIds = [...new Set(ideas.map((idea) => idea.authorId))];
    const authors = await this.userRepository.findByIds(authorIds);
    const nameById = new Map(authors.map((u) => [u.id, u.name]));

    return ideas.map((idea) =>
      toIdeaOutputDTO(idea, nameById.get(idea.authorId) ?? "Colaborador"),
    );
  }
}
