import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../../../src/integration/messaging/rabbitmq.service.js';

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('RabbitMQService', () => {
  let service: RabbitMQService;

  beforeEach(async () => {
    const configService = {
      get: jest.fn().mockReturnValue({
        rabbitmq: { url: 'amqp://localhost:5672' },
      }),
    } as unknown as ConfigService;

    service = new RabbitMQService(configService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should connect successfully', () => {
    expect(service.getChannel()).toBeDefined();
  });

  it('should publish a message', () => {
    const result = service.publish('test.event', { key: 'value' }, 'trace-123');
    expect(result).toBe(true);
  });
});
