import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IdeaOutputDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";

export class GetIdeaByIdUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<IdeaOutputDTO> {
    const idea = await this.ideaRepository.findById(id);

    if (!idea) {
      throw new Error("Ideia não encontrada");
    }

    const [author] = await this.userRepository.findByIds([idea.authorId]);

    return toIdeaOutputDTO(idea, author?.name ?? "Colaborador");
  }
}
