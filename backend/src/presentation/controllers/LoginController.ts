import { Request, Response } from "express";
import { LoginUserStory } from "../../application/userstories/LoginUserStory";

export class LoginController {
  constructor(private readonly loginUserStory: LoginUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;
      const output = await this.loginUserStory.execute({ email, password });

      return res.status(200).json(output);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof Error && error.message === "Account is not approved") {
        return res.status(403).json({ error: error.message });
      }

      if (
        error instanceof Error &&
        error.message === "JWT_SECRET is not configured"
      ) {
        console.error(error.message);
        return res.status(500).json({ error: "Authentication is not configured" });
      }

      console.error("Login failed:", error);
      return res.status(500).json({ error: "Unable to process login" });
    }
  }
}
