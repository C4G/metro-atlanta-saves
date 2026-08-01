import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('blogs')
@ApiBearerAuth()
@ApiTags('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  @Get()
  findAll() {
    return this.blogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.blogsService.findOneBySlug(slug);
  }

  @Patch(':id')
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
