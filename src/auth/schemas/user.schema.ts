import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop()
  name: string;

  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;

  @Prop()
  password: string;

  @Prop()
  token: string;

  @Prop()
  doMin: number;
  @Prop()
  doMax: number;

  @Prop()
  tempMin: number;
  @Prop()
  tempMax: number;

  @Prop()
  phMin: number;
  @Prop()
  phMax: number;

  @Prop()
  line_token: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
