import { IsEnum, IsUrl } from 'class-validator';
import { PostSource } from '@prisma/client';

export class CreatePostDto {
  @IsUrl({ require_tld: false }, { message: 'gifUrl must be a valid URL' })
  gifUrl!: string;

  @IsEnum(PostSource)
  source!: PostSource;
}
