import { IsDateString } from 'class-validator';

export class CreateShareDto {
  @IsDateString()
  expiresAt!: string;
}
