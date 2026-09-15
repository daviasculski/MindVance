import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";

export class DeleteIdeaUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(id: string): Promise<void> {
    const existingIdea = await this.ideaRepository.findById(id);

    if (!existingIdea) {
      throw new Error("Ideia não encontrada");
    }

    await this.ideaRepository.delete(id);
  }
}
