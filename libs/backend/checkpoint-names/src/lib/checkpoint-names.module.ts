import { Module } from '@nestjs/common';
import { CheckpointNamesController } from './checkpoint-names.controller';
import { CheckpointNamesService } from './checkpoint-names.service';

@Module({
  controllers: [CheckpointNamesController],
  providers: [CheckpointNamesService],
  exports: [CheckpointNamesService],
})
export class CheckpointNamesModule {}
