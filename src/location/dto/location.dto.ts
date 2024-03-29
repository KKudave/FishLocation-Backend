import { IsNotEmpty } from 'class-validator';

export class LocationDto {
  @IsNotEmpty()
  readonly tokenUser: string;

  @IsNotEmpty()
  readonly hz: string;

  @IsNotEmpty()
  readonly query: string;
}
