import { IsNotEmpty, IsString } from 'class-validator';

export class CategoryRequest {
  @IsString()
  @IsNotEmpty()
  category = '';
}
