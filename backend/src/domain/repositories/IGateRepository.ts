import { Gate } from "../entities/Gate";
import { IdeaStage } from "../entities/IdeaStage";

export interface IGateRepository {
  findAll(): Promise<Gate[]>;
  findById(id: string): Promise<Gate | null>;
  /** Gate de saída do estágio; null quando o estágio é o final (Lançamento) */
  findByFromStage(stage: IdeaStage): Promise<Gate | null>;
}
