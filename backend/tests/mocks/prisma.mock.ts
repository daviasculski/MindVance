type ModelMock = Record<string, jest.Mock>;

const modelMock = (): ModelMock => ({
  create: jest.fn(),
  createMany: jest.fn(),
  findUnique: jest.fn(),
  findUniqueOrThrow: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
  aggregate: jest.fn(),
});

interface PrismaMock {
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
  user: ModelMock;
  idea: ModelMock;
  attachment: ModelMock;
  gate: ModelMock;
  gateReview: ModelMock;
  gateReviewEvaluator: ModelMock;
  evaluation: ModelMock;
  gateDecision: ModelMock;
  manualStageTransition: ModelMock;
  notification: ModelMock;
  passwordResetToken: ModelMock;
}

export const prismaMock: PrismaMock = {
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  user: modelMock(),
  idea: modelMock(),
  attachment: modelMock(),
  gate: modelMock(),
  gateReview: modelMock(),
  gateReviewEvaluator: modelMock(),
  evaluation: modelMock(),
  gateDecision: modelMock(),
  manualStageTransition: modelMock(),
  notification: modelMock(),
  passwordResetToken: modelMock(),
};

prismaMock.$transaction.mockImplementation(
  (operation: Promise<unknown>[] | ((transaction: PrismaMock) => Promise<unknown>)) =>
    typeof operation === "function"
      ? operation(prismaMock)
      : Promise.all(operation),
);

export function resetPrismaMock(): void {
  for (const model of [
    prismaMock.user,
    prismaMock.idea,
    prismaMock.attachment,
    prismaMock.gate,
    prismaMock.gateReview,
    prismaMock.gateReviewEvaluator,
    prismaMock.evaluation,
    prismaMock.gateDecision,
    prismaMock.manualStageTransition,
    prismaMock.notification,
    prismaMock.passwordResetToken,
  ]) {
    for (const method of Object.values(model)) {
      method.mockReset();
    }
  }

  prismaMock.$queryRaw.mockReset();
  prismaMock.$transaction.mockReset();
  prismaMock.$transaction.mockImplementation(
    (operation: Promise<unknown>[] | ((transaction: PrismaMock) => Promise<unknown>)) =>
      typeof operation === "function"
        ? operation(prismaMock)
        : Promise.all(operation),
  );
}
