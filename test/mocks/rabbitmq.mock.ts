export const mockRabbitMQService = {
  publish: jest.fn<boolean, []>().mockReturnValue(true),
  getChannel: jest.fn().mockReturnValue(null),
  onModuleInit: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  onModuleDestroy: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  disconnect: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
};

export function resetRabbitMQMock(): void {
  Object.values(mockRabbitMQService).forEach((fn) => fn.mockReset());
  mockRabbitMQService.publish.mockReturnValue(true);
}
