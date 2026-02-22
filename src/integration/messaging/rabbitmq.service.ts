import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { AppConfig } from '../../config/app.config.js';
import { EXCHANGES, QUEUES, TRACE_ID_HEADER } from '../../utils/constants.js';

export interface EventMessage {
  eventId: string;
  eventType: string;
  timestamp: string;
  traceId: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const appCfg = this.configService.get<AppConfig>('app');
    const url = appCfg?.rabbitmq.url ?? 'amqp://localhost:5672';

    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      // Set up exchange
      await this.channel.assertExchange(EXCHANGES.EVENTS, 'topic', { durable: true });

      // Set up DLQ
      await this.channel.assertQueue(QUEUES.GATEWAY_DLQ, { durable: true });
      await this.channel.bindQueue(QUEUES.GATEWAY_DLQ, EXCHANGES.EVENTS, `${QUEUES.GATEWAY_DLQ}.#`);

      // Set up main queue with DLQ
      await this.channel.assertQueue(QUEUES.GATEWAY_EVENTS, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGES.EVENTS,
          'x-dead-letter-routing-key': `${QUEUES.GATEWAY_DLQ}.rejected`,
        },
      });

      this.connection.on('error', (err: Error) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });

      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to connect to RabbitMQ: ${message}`);
    }
  }

  publish(routingKey: string, payload: Record<string, unknown>, traceId: string): boolean {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel not available');
      return false;
    }

    const event: EventMessage = {
      eventId: uuidv4(),
      eventType: routingKey,
      timestamp: new Date().toISOString(),
      traceId,
      payload,
    };

    try {
      const content = Buffer.from(JSON.stringify(event));
      this.channel.publish(EXCHANGES.EVENTS, routingKey, content, {
        persistent: true,
        messageId: event.eventId,
        headers: {
          [TRACE_ID_HEADER]: traceId,
          'idempotency-key': event.eventId,
        },
      });

      this.logger.debug(`Published event: ${routingKey} [${event.eventId}]`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to publish event ${routingKey}: ${message}`);
      return false;
    }
  }

  getChannel(): amqplib.Channel | null {
    return this.channel;
  }

  async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ disconnected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error disconnecting from RabbitMQ: ${message}`);
    }
  }
}
