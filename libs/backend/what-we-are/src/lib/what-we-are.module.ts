import { Module } from '@nestjs/common';
import { WhatWeAreService } from './what-we-are.service';
import { WhatWeAreController } from './what-we-are.controller';

@Module({
  controllers: [WhatWeAreController],
  providers: [WhatWeAreService],
  exports: [WhatWeAreService],
})
export class WhatWeAreModule {}
