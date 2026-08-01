import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserGuideService } from './user-guide.service';
import { UpdateUserGuideDto } from './dto/update-user-guide.dto';

@Controller('user-guide')
export class UserGuideController {
  constructor(private userGuideService: UserGuideService) {}

  @Get()
  findAll() {
    return this.userGuideService.find();
  }

  @Patch()
  update(@Body() updateUserGuideDto: UpdateUserGuideDto) {
    return this.userGuideService.update(updateUserGuideDto);
  }
}
