import {
  IsNotEmpty,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';

class Data {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}

export class ThresholdDto {
  @IsNotEmpty()
  id: string;

  @IsObject()
  @ValidateNested()
  data: Data;
}
