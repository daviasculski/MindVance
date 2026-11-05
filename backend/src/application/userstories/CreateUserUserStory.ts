import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  CreateUserInputDTO,
  CreateUserOutputDTO,
} from "../dtos/CreateUserDTO";
import { isUserRole } from "../../domain/entities/UserRole";
import { Notifier } from "../services/Notifier";
import { IEmailService } from "../services/IEmailService";

export class CreateUserUserStory {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly notifier: Notifier,
    private readonly emailService: IEmailService,
  ) {}

  async execute(
    input: CreateUserInputDTO,
    allowAdminCreation = false,
  ): Promise<CreateUserOutputDTO> {
    if (
      typeof input.name !== "string" ||
      input.name.trim().length === 0 ||
      typeof input.email !== "string" ||
      input.email.trim().length === 0 ||
      typeof input.password !== "string" ||
      input.password.length === 0
    ) {
      throw new Error("Name, email, and password are required");
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const role = input.role ?? "COLLABORATOR";

    if (!isUserRole(role)) {
      throw new Error("Invalid user role");
    }

    if (role === "ADMIN" && !allowAdminCreation) {
      throw new Error(
        "Admin accounts cannot be created through public registration",
      );
    }

    // Só colaboradores pertencem a um departamento (AUT-01)
    const department =
      role === "COLLABORATOR" && typeof input.department === "string"
        ? input.department.trim()
        : "";
    if (role === "COLLABORATOR" && department.length === 0) {
      throw new Error("User department is required");
    }

    if (await this.userRepository.findByEmail(email)) {
      throw new Error("Email is already registered");
    }

    const password = await bcrypt.hash(input.password, 8);
    // Passa o role para o repositório criar a entidade com o perfil correto
    const user = await this.userRepository.create({
      name,
      email,
      password,
      role,
      department: department || null,
    });
    if (role === "EVALUATOR" || role === "GATEKEEPER") {
      const requestedRole =
        role === "EVALUATOR" ? "Avaliador" : "Gestor de Inovação";
      this.notifier.accountApprovalRequested(name, requestedRole);
      console.log(
        `[CreateUser] Tentando enviar e-mail de conta em análise para: ${user.email}`,
      );
      void this.emailService
        .sendAccountPendingApprovalEmail(user.email, user.name, requestedRole)
        .then(() =>
          console.log(
            `[CreateUser] E-mail de conta em análise enviado com SUCESSO para: ${user.email}`,
          ),
        )
        .catch((error: unknown) =>
          console.error(
            `[CreateUser] ERRO ao enviar e-mail para ${user.email}:`,
            error,
          ),
        );
    } else {
      void this.emailService
        .sendWelcomeEmail(user.email, user.name)
        .catch((error: unknown) => console.error("Welcome email delivery failed:", error));
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, // <-- Opcional, mas útil para retornar no output DTO
      approvalStatus: user.approvalStatus,
      department: user.department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}