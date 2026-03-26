import { IsEmail, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[A-Za-z_]+$/, { message: 'username can only contain letters and underscores' })
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
