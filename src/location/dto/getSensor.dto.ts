import { IsNotEmpty } from 'class-validator';

export class GetSensorDto {
  @IsNotEmpty()
  readonly tokenUser: string;

  @IsNotEmpty()
  readonly time: number;
}
