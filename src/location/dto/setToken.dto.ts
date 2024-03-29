import { IsNotEmpty } from 'class-validator';

export class SetTokenDto {
  @IsNotEmpty()
  readonly lineToken: string;
}
