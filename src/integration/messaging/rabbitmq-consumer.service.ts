import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { RabbitMQService, EventMessage } from './rabbitmq.service.js';
import { QUEUES } from '../../utils/constants.js';

export type MessageHandler = (event: EventMessage) => Promise<void>;

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private readonly handlers = new Map<string, MessageHandler>();
  private readonly processedIds = new Set<string>();

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit(): Promise<void> {
    await this.startConsuming();
  }

  registerHandler(eventType: string, handler: MessageHandler): void {
    this.handlers.set(eventType, handler);
    this.logger.log(`Registered handler for event: ${eventType}`);
  }

  private async startConsuming(): Promise<void> {
    const channel = this.rabbitMQService.getChannel();
    if (!channel) {
      this.logger.warn('RabbitMQ channel not available for consuming');
      return;
    }

    await channel.consume(
      QUEUES.GATEWAY_EVENTS,
      (msg: amqplib.ConsumeMessage | null) => {
        if (!msg) return;
        void this.handleMessage(channel, msg);
      },
      { noAck: false },
    );

    this.logger.log(`Consuming from queue: ${QUEUES.GATEWAY_EVENTS}`);
  }

  private async handleMessage(
    channel: amqplib.Channel,
    msg: amqplib.ConsumeMessage,
  ): Promise<void> {
    try {
      const event = JSON.parse(msg.content.toString()) as EventMessage;

      if (this.processedIds.has(event.eventId)) {
        this.logger.debug(`Duplicate event skipped: ${event.eventId}`);
        channel.ack(msg);
        return;
      }

      const handler = this.handlers.get(event.eventType);
      if (handler) {
        await handler(event);
        this.processedIds.add(event.eventId);

        if (this.processedIds.size > 10000) {
          const iterator = this.processedIds.values();
          const first = iterator.next();
          if (!first.done) {
            this.processedIds.delete(first.value);
          }
        }
      } else {
        this.logger.warn(`No handler for event type: ${event.eventType}`);
      }

      channel.ack(msg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing message: ${message}`);
      channel.nack(msg, false, false);
    }
  }
}
