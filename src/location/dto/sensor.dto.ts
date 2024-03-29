import { IsNotEmpty } from 'class-validator';

export class SensorDto {
  @IsNotEmpty()
  readonly DO: number;

  @IsNotEmpty()
  readonly Temp: number;

  @IsNotEmpty()
  readonly pH: number;
}
