import { IsEnum, Matches } from 'class-validator';
import { PostSource } from '@prisma/client';

export class CreatePostDto {
  @Matches(/^(https?:\/\/\S+\.(gif|webp|png|jpe?g)(\?\S*)?(#\S*)?|\/uploads\/\S+\.(gif|webp|png|jpe?g))$/i, {
    message: 'gifUrl must be a valid media URL or upload path (.gif, .webp, .png, .jpg, .jpeg)',
  })
  gifUrl!: string;

  @IsEnum(PostSource)
  source!: PostSource;
}
