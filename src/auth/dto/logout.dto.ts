import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly token: string;
}
