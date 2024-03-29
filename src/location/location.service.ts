import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { SensorDto } from './dto/sensor.dto';
import { ThresholdDto } from './dto/SetThreshold.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { SetTokenDto } from './dto/setToken.dto';

const url = 'http://128.199.190.243:8086/';
const token =
  'zToxNuexyNL-hhcWZDzsYon974zULEcxiQdcscktFzyyEeHKWlgW4BgDe7pAnU3DiIqbo_zfP6nAKa7A8dxXig==';
const org = 'KMITL';
const bucket = 'TestBack';
const influxDB = new InfluxDB({ url, token });
const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
const writeApi = influxDB.getWriteApi(org, bucket);
let i = 0;
let pi = [];
let temppo = [];

@Injectable()
export class Location {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const multilaterationService = new MultilaterationService();
    const writeApi = influxDB.getWriteApi(org, bucket);
    const DO = (Math.random() * (7 - 4) + 4).toFixed(1);
    const Temp = (Math.random() * (30.0 - 25.0) + 25.0).toFixed(1);
    const pH = (Math.random() * (9.0 - 6.5) + 6.5).toFixed(1);
    const point2 = new Point('Sensor')
      .floatField('DO', DO)
      .floatField('Temp', Temp)
      .floatField('pH', pH);
    writeApi.writePoint(point2);

    const fluxQuery =
      'from(bucket: "TestReal")|> range(start: -1d)|> filter(fn: (r) => r["_measurement"] == "Pi 1" or r["_measurement"] == "Pi 2" or r["_measurement"] == "Pi 3" or r["_measurement"] == "Pi 4")|> filter(fn: (r) => r["freq"] == "144.69140625")|> filter(fn: (r) => r["_field"] == "filtered_rssi")|> last()';
    const myQuery = async () => {
      const results = [];
      const pi = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }
      results.forEach((item) => {
        if (item._measurement === 'Pi 1') {
          pi[0] = item._value;
        } else if (item._measurement === 'Pi 2') {
          pi[1] = item._value;
        } else if (item._measurement === 'Pi 3') {
          pi[2] = item._value;
        } else if (item._measurement === 'Pi 4') {
          pi[3] = item._value;
        }
      });
      return pi;
    };
    const pi = await myQuery();
    if (pi) {
      const p0k = [-3, -11, -7, -6];
      const r = multilaterationService.calculateDk(p0k, pi);
      console.log('r=' + r);
      const xyNode = [
        [0.0, 0.0, 2.0],
        [0.0, 2.0, 2.0],
        [2.0, 2.0, 2.0],
        [2.0, 0.0, 2.0],
      ];
      const xyCal = multilaterationService.multilateration2D(xyNode, r);
      if (-xyCal[0] < 0) {
        xyCal[0] = 0;
      } else if (-xyCal[0] > 2) {
        xyCal[0] = -2;
      }
      if (-xyCal[1] < 0) {
        xyCal[1] = 0;
      } else if (-xyCal[1] > 2) {
        xyCal[1] = -2;
      }
      console.log(`X: ${-xyCal[0].toFixed(2)} m Y: ${-xyCal[1].toFixed(2)}`);
      const z = multilaterationService.calculateZCoordinate(xyCal, xyNode, r);
      let v = 0;
      if (temppo == null) {
        temppo[0] = xyCal[0].toFixed(2);
        temppo[1] = xyCal[1].toFixed(2);
        temppo[0] = -z.toFixed(2);
      } else {
        const distance = Math.sqrt(
          Math.pow(-xyCal[0].toFixed(2) - temppo[0], 2) +
            Math.pow(-xyCal[1].toFixed(2) - temppo[1], 2) +
            Math.pow(z - temppo[2], 2),
        );
        const angle =
          Math.atan2(
            -xyCal[1].toFixed(2) - temppo[1],
            -xyCal[0].toFixed(2) - temppo[0],
          ) *
          (180 / Math.PI);
        console.log('tat = ' + temppo);

        v = distance / 30;
        temppo[0] = -xyCal[0].toFixed(2);
        temppo[1] = -xyCal[1].toFixed(2);
        temppo[2] = -z.toFixed(2);
        console.log('tat = ' + temppo);
        console.log('angle = ' + angle);
        console.log('v = ' + v);
      }
      const point3 = new Point('Location')
        .tag('hz', '144.691')
        .floatField('x', -xyCal[0].toFixed(2))
        .floatField('y', -xyCal[1].toFixed(2))
        .floatField('z', (z * -1).toFixed(2))
        .floatField('v', v.toFixed(4));
      writeApi.writePoint(point3);
      writeApi.close().then(() => {
        console.log('WRITE FINISHED');
      });
      console.log('This will be executed every minute');
    }
  }
}

@Injectable()
export class MultilaterationService {
  multilateration2D(xy: number[][], r: number[]): [number, number] {
    if (xy.length !== 4 || r.length !== 4) {
      throw new Error(
        'You need exactly 4 receiver coordinates and 4 distances.',
      );
    }
    const A: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    const B: number[] = [0, 0, 0];
    for (let i = 1; i < 4; i++) {
      A[i - 1][0] = 2 * (xy[i][0] - xy[0][0]);
      A[i - 1][1] = 2 * (xy[i][1] - xy[0][1]);
      B[i - 1] =
        r[0] ** 2 -
        r[i] ** 2 -
        xy[0][0] ** 2 +
        xy[i][0] ** 2 -
        xy[0][1] ** 2 +
        xy[i][1] ** 2;
    }
    const math = require('mathjs');
    const result = math.multiply(math.pinv(A), math.multiply(-1, B));
    const det = A[0][0] * A[1][1] - A[1][0] * A[0][1];
    if (det === 0) {
      throw new Error(
        'The system of equations is singular or ill-conditioned. Unable to solve.',
      );
    }
    const x = (A[1][1] * B[0] - A[0][1] * B[1]) / det;
    const y = (A[0][0] * B[1] - A[1][0] * B[0]) / det;
    return result;
  }

  calculateZCoordinate(
    xyPosition: [number, number],
    nodePositions: number[][],
    distances: number[],
  ): number | null {
    const zValues: number[] = [];
    let [x, y] = xyPosition;
    x *= -1;
    y *= -1;

    for (const [xN, yN, zN] of nodePositions) {
      const dXY = Math.sqrt(Math.pow(x - xN, 2) + Math.pow(y - yN, 2));
      const zSquare = Math.pow(distances[i], 2) - Math.pow(dXY, 2);

      if (zSquare >= 0) {
        const z = Math.sqrt(zSquare);
        zValues.push(z);
      }
    }

    if (zValues.length > 0) {
      return zValues.reduce((sum, z) => sum + z, 0) / zValues.length;
    } else {
      return 0;
    }
  }

  calculateDk(p0k: number[], rssi: number[]): number[] {
    const lk = 5.0;
    const result = [];
    for (let i = 0; i <= 3; i++) {
      result[i] = 10 ** ((p0k[i] - rssi[i]) / (10 * lk));
    }
    return result;
  }
}

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async GetLastLocation() {
    let fluxQuery =
      'from(bucket: "TestBack")|> range(start: -10m)|> filter(fn: (r) => r._measurement == "Location")|> last()';
    const myQuery = async () => {
      const results = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }
      let x,
        y,
        z,
        v = 0;
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        if (item._field == 'x') {
          x = item._value;
        } else if (item._field == 'y') {
          y = item._value;
        } else if (item._field == 'z') {
          z = item._value;
        } else if (item._field == 'v') {
          v = item._value;
        }
      }
      const jsonData = {
        id: '144.691',
        x: x,
        y: y,
        z: z,
        v: v,
      };
      return jsonData;
    };
    return myQuery();
  }
  async Getlocation(time: number) {
    let fluxQuery =
      'from(bucket: "TestBack")|> range(start: -' +
      time +
      'm)|> filter(fn: (r) => r._measurement == "Location")|> aggregateWindow(every: 5m, fn: last, createEmpty: true)';
    if (time == 5) {
      fluxQuery =
        'from(bucket: "TestBack")|> range(start: -' +
        time +
        'm)|> filter(fn: (r) => r._measurement == "Location")|> last()';
    }
    let result;
    const myQuery = async () => {
      const results = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }

      const jsonData = [];
      let x = [];
      let y = [];
      let z = [];
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        if (item._field == 'x') {
          x.push(item._value);
        } else if (item._field == 'y') {
          y.push(item._value);
        } else if (item._field == 'z') {
          z.push(item._value);
        }
      }

      for (let j = 0; j < x.length; j++) {
        jsonData.push({ id: '144.691', x: x[j], y: y[j], z: z[j] });
      }
      return jsonData;
    };

    const location = myQuery();
    return location;
  }

  async SetSensor(sensorDto: SensorDto) {
    const { DO, Temp, pH } = sensorDto;
    const writeApi = influxDB.getWriteApi(org, bucket);
    const point1 = new Point('Sensor')
      .floatField('DO', DO)
      .floatField('Temp', Temp)
      .floatField('pH', pH);
    writeApi.writePoint(point1);
    writeApi.close().then(() => {
      console.log('WRITE FINISHED');
    });
    return;
  }

  async GetSensor() {
    const fluxQuery =
      'from(bucket: "TestBack")|> range(start: -7d)|> filter(fn: (r) => r._measurement == "Sensor" )|> last()';
    const myQuery = async () => {
      const results = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }

      const jsonData = {
        do: results[0]._value,
        temp: results[1]._value,
        ph: results[2]._value,
      };
      return jsonData;
    };
    return myQuery();
  }

  async GetSensorDetail(time: number): Promise<{}> {
    const time2 = time / 5;
    const fluxQuery =
      'from(bucket: "TestBack")|> range(start: -' +
      time +
      'm)|> filter(fn: (r) => r._measurement == "Sensor" )  |> aggregateWindow(every: 5m, fn: last, createEmpty: true)';
    const myQuery = async () => {
      const results = [];
      const DO = [];
      const temp = [];
      const ph = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }
      results.forEach((item) => {
        if (item._field === 'DO') {
          DO.push(item._value);
        } else if (item._field === 'Temp') {
          temp.push(item._value);
        } else if (item._field === 'pH') {
          ph.push(item._value);
        }
      });
      const jsonData = [];

      for (let i = 0; i < time2; i++) {
        const data = {
          timestamps: 'time' + (i + 1),
          do: DO[i],
          temp: temp[i],
          ph: ph[i],
        };
        jsonData.push(data);
      }
      return jsonData;
    };
    return myQuery();
  }

  async GetSensorDetail2(time: number): Promise<{}> {
    const time_temp = 1;
    const time2 = time / 5;
    const fluxQuery =
      'from(bucket: "TestBack")|> range(start: -' +
      time2 +
      'm)|> filter(fn: (r) => r._measurement == "Sensor" )  |> aggregateWindow(every: 1m, fn: last, createEmpty: true)';
    const myQuery = async () => {
      const results = [];
      const DO = [];
      const temp = [];
      const ph = [];
      for await (const { values, tableMeta } of queryApi.iterateRows(
        fluxQuery,
      )) {
        const o = tableMeta.toObject(values);
        results.push(o);
      }
      results.forEach((item) => {
        if (item._field === 'DO') {
          DO.push(item._value);
        } else if (item._field === 'Temp') {
          temp.push(item._value);
        } else if (item._field === 'pH') {
          ph.push(item._value);
        }
      });
      const jsonData = [];
      const field = ['do', 'temp', 'ph'];
      for (let i = 0; i < 3; i++) {
        const dataArray = [];
        for (let j = 0; j < time2; j++) {
          const t = 'time' + (j + 1);
          if (i === 0) {
            const obj = { x: t, y: DO[j] };
            dataArray.push(obj);
          } else if (i === 1) {
            const obj = { x: t, y: temp[j] };
            dataArray.push(obj);
          } else if (i === 2) {
            const obj = { x: t, y: ph[j] };
            dataArray.push(obj);
          }
        }
        jsonData.push({ id: field[i], data: dataArray });
      }
      return jsonData;
    };
    return myQuery();
  }

  async SetThreshold(thresholdDto: ThresholdDto, token: string) {
    const user = await this.userModel.findOne({ token });
    console.log('in = ' + thresholdDto);
    user.doMin = thresholdDto[0].data.min;
    user.doMax = thresholdDto[0].data.max;
    user.tempMin = thresholdDto[1].data.min;
    user.tempMax = thresholdDto[1].data.max;
    user.phMin = thresholdDto[2].data.min;
    user.phMax = thresholdDto[2].data.max;
    await user.save();
  }

  async GetThreshold(token: string) {
    const user = await this.userModel.findOne({ token });
    const jsonData = [
      {
        id: 'Do',
        data: {
          min: user.doMin,
          max: user.doMax,
        },
      },
      {
        id: 'Temp',
        data: {
          min: user.tempMin,
          max: user.tempMax,
        },
      },
      {
        id: 'pH',
        data: {
          min: user.phMin,
          max: user.phMax,
        },
      },
    ];
    return jsonData;
  }

  async SetLineToken(setTokenDto: SetTokenDto, token: string) {
    const user = await this.userModel.findOne({ token });
    console.log('line = ' + setTokenDto.lineToken);
    user.line_token = setTokenDto.lineToken;
    await user.save();
  }

  async GetLineToken(token: string) {
    const user = await this.userModel.findOne({ token });
    const jsonData = { lineToken: user.line_token };
    return jsonData;
  }

  async SendNoti(token: string, message: string = '') {
    const axios = require('axios');
    try {
      const LINE_NOTIFY_TOKEN = token;
      const response = await axios.post(
        'https://notify-api.line.me/api/notify',
        `message=${message}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
          },
        },
      );
      console.log(response.data);
    } catch (error) {
      console.error('Error sending Line Notify:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async CheckSensor() {
    const sensor = this.GetSensor();
    const DO = (await sensor).do;
    const Temp = (await sensor).temp;
    const pH = (await sensor).ph;
    try {
      const users = await this.userModel.find({});
      let message = '';
      users.forEach((user) => {
        if (user.doMin >= DO) {
          message = 'Sensor DO วัดค่าได้ ' + DO + ' ซึ่งน้อยกว่าค่าที่กำหนด';
        } else if (user.doMax <= DO) {
          message = 'Sensor DO วัดค่าได้ ' + DO + ' ซึ่งมากกว่าค่าที่กำหนด';
        }
        if (message != '') {
          this.SendNoti(user.line_token, message);
          message = '';
        }
        if (user.tempMin >= Temp) {
          message =
            'Sensor อุณหภุมิวัดค่าได้ ' + Temp + ' องศาซึ่งน้อยกว่าค่าที่กำหนด';
        } else if (user.tempMax <= Temp) {
          message =
            'Sensor อุณหภุมิวัดค่าได้ ' + Temp + ' องศาซึ่งมากกว่าค่าที่กำหนด';
        }
        if (message != '') {
          this.SendNoti(user.line_token, message);
          message = '';
        }
        if (user.phMin >= pH) {
          message = 'Sensor pH วัดค่าได้ ' + pH + ' ซึ่งน้อยกว่าค่าที่กำหนด';
        } else if (user.phMax <= pH) {
          message = 'Sensor pH วัดค่าได้ ' + pH + ' ซึ่งมากกว่าค่าที่กำหนด';
        }
        if (message != '') {
          this.SendNoti(user.line_token, message);
          message = '';
        }
      });
    } catch (error) {}
  }
}
