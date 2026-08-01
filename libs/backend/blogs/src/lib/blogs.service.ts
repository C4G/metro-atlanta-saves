import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from '@mas/backend-prisma';

const convertToSlug = (text: string): string => {
  return text
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace consecutive hyphens with a single hyphen
    .trim(); // Trim leading/trailing whitespace (optional)
};

@Injectable()
export class BlogsService {
  constructor(private prismaService: PrismaService) {}

  async create(createBlogDto: CreateBlogDto) {
    const blogWithSlug = { ...createBlogDto, slug: convertToSlug(createBlogDto.slug || createBlogDto.title) };
    const existingBlog = await this.prismaService.blog.findUnique({
      where: { slug: blogWithSlug.slug },
    });
    if (existingBlog) {
      throw new BadRequestException(['The slug already exists or title is already taken. ']);
    }

    try {
      return await this.prismaService.blog.create({
        data: blogWithSlug,
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add blog post']);
    }
  }

  async findAll() {
    return await this.prismaService.blog.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.blog.findUnique({
      where: { id },
    });
  }

  async findOneBySlug(slug: string) {
    return await this.prismaService.blog.findUnique({
      where: { slug },
    });
  }

  async update(id: string, body: UpdateBlogDto) {
    return await this.prismaService.blog.update({
      where: { id },
      data: { ...body, updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    const blog = await this.prismaService.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new BadRequestException(["The blog doesn't exist"]);
    }
    try {
      return await this.prismaService.blog.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete blog post']);
    }
  }
}
