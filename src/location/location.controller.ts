import { Body, Controller, Get, Post, Query, Headers } from '@nestjs/common';
import { LocationService } from './location.service';
import { SensorDto } from './dto/sensor.dto';
import { ThresholdDto } from './dto/SetThreshold.dto';
import { SetTokenDto } from './dto/setToken.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';

@Controller('location')
export class LocationController {
  constructor(
    private locationService: LocationService,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}
  @Get('/location')
  async location(@Query('time') time: number) {
    return this.locationService.Getlocation(time);
  }

  @Get('/lastlocation')
  async lastlocation() {
    return this.locationService.GetLastLocation();
  }

  @Post('/sensor')
  async sensor(@Body() sensorDto: SensorDto) {
    this.locationService.SetSensor(sensorDto);
  }

  @Get('/sensor')
  async getSensor() {
    return this.locationService.GetSensor();
  }

  @Get('/sensordetail')
  async getSensorDetail(@Query('time') time: number) {
    return this.locationService.GetSensorDetail(time);
  }

  @Get('/sensordetail2')
  async getSensorDetail2(@Query('time') time: number) {
    return this.locationService.GetSensorDetail2(time);
  }

  @Post('/setthreshold')
  async setThreshold(
    @Headers('authorization') authorizationHeader: string,
    @Body() thresholdDto: ThresholdDto,
  ) {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];

    console.log(token);
    this.locationService.SetThreshold(thresholdDto, token);
  }

  @Post('/settoken')
  async setToken(
    @Headers('authorization') authorizationHeader: string,
    @Body() setTokenDto: SetTokenDto,
  ) {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
    console.log('line = ' + token);
    this.locationService.SetLineToken(setTokenDto, token);
  }

  @Get('/getthreshold')
  async getThreshold(@Headers('authorization') authorizationHeader: string) {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
    return this.locationService.GetThreshold(token);
  }

  @Get('/gettoken')
  async getToken(@Headers('authorization') authorizationHeader: string) {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
    return this.locationService.GetLineToken(token);
  }

  @Get('/send')
  async SendNoti(@Headers('authorization') authorizationHeader: string) {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
    const user = await this.userModel.findOne({ token });
    this.locationService.SendNoti(user.line_token, 'Test');
  }
}
