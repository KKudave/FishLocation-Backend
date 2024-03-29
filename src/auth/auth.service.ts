import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { MailerService } from '@nestjs-modules/mailer';

import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetDto } from './dto/reset.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
    const { name, email, password } = signUpDto;
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('This email address is already exist');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (password.length < 6) {
      throw new UnauthorizedException('Password must be more than 6');
    }

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({ id: user._id });
    user.token = token;
    await user.save();
    return { token };
  }

  async login(loginDto: LoginDto): Promise<{ name: string; token: string }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ id: user._id });
    user.token = token;
    await user.save();
    return { name: user.name, token };
  }

  async logout(token: string): Promise<{ token: string }> {
    const user = await this.userModel.findOne({ token });

    if (!user) {
      throw new UnauthorizedException('Invalid Token');
    }
    user.token = '';
    await user.save();
    return;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token);
      console.log(decoded);
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async sendEmail(email: string, OTP: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset-Password',
      text: 'นำ OTP ที่ได้กรอกในหน้าเว็บไซต์เพื่อ Reset Password OTP = ' + OTP,
    });
  }

  async resetPassword(resetDto: ResetDto) {
    const { email, password } = resetDto;
    const user = await this.userModel.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    const token = this.jwtService.sign({ id: user._id });
    user.token = token;
    user.save();
    const jsonData = {
      token: token,
    };
    return jsonData;
  }
}
