import { Request, Response } from "express";
import { ForgotPasswordUserStory } from "../../application/userstories/ForgotPasswordUserStory";
import { ResetPasswordUserStory } from "../../application/userstories/ResetPasswordUserStory";

export class PasswordResetController {
  constructor(
    private readonly forgotPassword: ForgotPasswordUserStory,
    private readonly resetPassword: ResetPasswordUserStory,
  ) {}

  async forgot(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.forgotPassword.execute(req.body?.email));
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "A valid email is required") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Password recovery request failed:", error);
      return res.status(500).json({ error: "Unable to process password recovery" });
    }
  }

  async reset(req: Request, res: Response): Promise<Response> {
    try {
      await this.resetPassword.execute(req.body?.token, req.body?.password);
      return res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("Password must")) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof Error && error.message === "A valid reset token is required") {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof Error && error.message === "Reset token is invalid or expired") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Password reset failed:", error);
      return res.status(500).json({ error: "Unable to reset password" });
    }
  }
}
