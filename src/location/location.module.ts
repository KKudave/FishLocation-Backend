import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService, Location } from './location.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [LocationController],
  providers: [LocationService, Location],
})
export class LocationModule {}
