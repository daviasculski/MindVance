import bcrypt from "bcryptjs";
import { User } from "../../src/domain/entities/User";
import { IUserRepository } from "../../src/domain/repositories/IUserRepository";
import { INotificationRepository } from "../../src/domain/repositories/INotificationRepository";
import { IEmailService } from "../../src/application/services/IEmailService";
import { Notifier } from "../../src/application/services/Notifier";
import { CreateUserUserStory } from "../../src/application/userstories/CreateUserUserStory";

function createHarness() {
  const users: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findPendingApprovals: jest.fn().mockResolvedValue([]),
    updateApprovalStatus: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    updateRole: jest.fn(),
  };
  users.create.mockImplementation(async (data) => {
    const timestamp = new Date();
    return new User({
      id: "user-1",
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      approvalStatus:
        data.role === "EVALUATOR" || data.role === "GATEKEEPER"
          ? "PENDING"
          : "APPROVED",
      department: data.department,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const notifications: jest.Mocked<INotificationRepository> = {
    createForUsers: jest.fn().mockResolvedValue(undefined),
    findByUser: jest.fn().mockResolvedValue([]),
    countUnread: jest.fn().mockResolvedValue(0),
    markRead: jest.fn().mockResolvedValue(false),
    markAllRead: jest.fn().mockResolvedValue(undefined),
    deleteAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const emailService: jest.Mocked<IEmailService> = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendIdeaSubmittedEmail: jest.fn().mockResolvedValue(undefined),
    sendIdeaEvaluatedToManagerEmail: jest.fn().mockResolvedValue(undefined),
    sendIdeaFinalDecisionEmail: jest.fn().mockResolvedValue(undefined),
    sendIdeaAssignedToEvaluatorEmail: jest.fn().mockResolvedValue(undefined),
    sendAllEvaluationsCompletedEmail: jest.fn().mockResolvedValue(undefined),
    sendNewIdeaToManagerEmail: jest.fn().mockResolvedValue(undefined),
    sendAccountApprovalRequestToAdminEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendAccountPendingApprovalEmail: jest.fn().mockResolvedValue(undefined),
    sendAccountDecisionEmail: jest.fn().mockResolvedValue(undefined),
  };
  const notifier = new Notifier(notifications, users, emailService);

  return {
    users,
    emailService,
    notifier,
    story: new CreateUserUserStory(users, notifier, emailService),
  };
}

describe("password hashing during registration", () => {
  it("stores a bcrypt hash instead of the submitted password", async () => {
    const { users, emailService, story } = createHarness();

    await story.execute({
      name: " Ada Lovelace ",
      email: " ADA@example.com ",
      password: "correct horse battery staple",
      department: " Research ",
    });

    const storedPassword = users.create.mock.calls[0][0].password;
    expect(storedPassword).not.toBe("correct horse battery staple");
    expect(storedPassword).toMatch(/^\$2[aby]\$/);
    await expect(
      bcrypt.compare("correct horse battery staple", storedPassword),
    ).resolves.toBe(true);
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ada Lovelace",
        email: "ada@example.com",
        department: "Research",
      }),
    );
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      "ada@example.com",
      "Ada Lovelace",
    );
  });

  it.each([
    [{ name: " " }, "Name, email, and password are required"],
    [{ email: " " }, "Name, email, and password are required"],
    [{ password: "" }, "Name, email, and password are required"],
  ])("rejects missing registration fields", async (override, message) => {
    const { story, users } = createHarness();

    await expect(
      story.execute({
        name: "User",
        email: "user@example.com",
        password: "password",
        department: "Engineering",
        ...override,
      }),
    ).rejects.toThrow(message);
    expect(users.create).not.toHaveBeenCalled();
  });

  it("rejects public administrator registration and collaborators without a department", async () => {
    const { story, users } = createHarness();

    await expect(
      story.execute({
        name: "Administrator",
        email: "admin@example.com",
        password: "password",
        role: "ADMIN",
      }),
    ).rejects.toThrow("Admin accounts cannot be created through public registration");
    await expect(
      story.execute({
        name: "Collaborator",
        email: "collaborator@example.com",
        password: "password",
        department: " ",
      }),
    ).rejects.toThrow("User department is required");
    expect(users.create).not.toHaveBeenCalled();
  });

  it("rejects an already registered email", async () => {
    const { story, users } = createHarness();
    users.findByEmail.mockResolvedValue(
      new User({
        id: "existing",
        name: "Existing user",
        email: "user@example.com",
        password: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      story.execute({
        name: "User",
        email: "USER@example.com",
        password: "password",
        department: "Engineering",
      }),
    ).rejects.toThrow("Email is already registered");
    expect(users.create).not.toHaveBeenCalled();
  });

  it.each([
    ["EVALUATOR", "Avaliador"],
    ["GATEKEEPER", "Gestor de Inovação"],
  ] as const)(
    "sends role-specific approval requests for %s accounts",
    async (role, requestedRole) => {
      const { story, notifier, emailService } = createHarness();
      const notification = jest
        .spyOn(notifier, "accountApprovalRequested")
        .mockImplementation(() => undefined);

      const result = await story.execute({
        name: "Reviewer",
        email: "reviewer@example.com",
        password: "password",
        role,
      });
      await Promise.resolve();

      expect(result.approvalStatus).toBe("PENDING");
      expect(notification).toHaveBeenCalledWith("Reviewer", requestedRole);
      expect(emailService.sendAccountPendingApprovalEmail).toHaveBeenCalledWith(
        "reviewer@example.com",
        "Reviewer",
        requestedRole,
      );
    },
  );
});
