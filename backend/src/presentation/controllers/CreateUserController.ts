import { Request, Response } from "express";
import { CreateUserUserStory } from "../../application/userstories/CreateUserUserStory";

export class CreateUserController {
  constructor(private readonly createUserUserStory: CreateUserUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password } = req.body;
      const user = await this.createUserUserStory.execute({
        name,
        email,
        password,
      });

      return res.status(201).json(user);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "Email is already registered"
      ) {
        return res.status(409).json({ error: error.message });
      }

      if (
        error instanceof Error &&
        error.message === "Name, email, and password are required"
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error("User registration failed:", error);
      return res.status(500).json({ error: "Unable to create user" });
    }
  }
}
