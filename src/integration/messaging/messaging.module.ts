import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service.js';
import { RabbitMQConsumerService } from './rabbitmq-consumer.service.js';

@Module({
  providers: [RabbitMQService, RabbitMQConsumerService],
  exports: [RabbitMQService, RabbitMQConsumerService],
})
export class MessagingModule {}
