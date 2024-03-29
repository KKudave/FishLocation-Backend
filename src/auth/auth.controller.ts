import {
  Body,
  Controller,
  UnauthorizedException,
  Get,
  Post,
  Put,
  Res,
  Headers,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { ResetDto } from './dto/reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<{ token: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Post('/login')
  login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(loginDto);
  }

  @Get('/logout')
  logout(
    @Headers('authorization') authorizationHeader: string,
  ): Promise<{ token: string }> {
    const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
    return this.authService.logout(token);
  }

  @Get('/validate')
  async validate(
    @Headers('authorization') authorizationHeader: string,
    @Res() res,
  ): Promise<void> {
    try {
      let isValidToken = false;
      let message = 'Invalid token';
      if (authorizationHeader) {
        const token = authorizationHeader.match(/Bearer\s(.+)/)[1];
        console.log('token =' + token);
        isValidToken = await this.authService.validateToken(token);
        if (isValidToken) {
          message = 'Token is valid';
        }
      } else {
        isValidToken = true;
        message = 'Guest access';
      }

      res.status(200).json({ success: isValidToken, message });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({ success: false, message: error.message });
      } else {
        res
          .status(500)
          .json({ success: false, message: 'Internal Server Error' });
      }
    }
  }

  @Get('/otp')
  async RequestOTP(@Query('email') email: string) {
    const OTP = Math.floor(Math.random() * 1000000);
    this.authService.sendEmail(email, OTP.toString());
    const jsonData = {
      otp: OTP.toString(),
    };
    return jsonData;
  }

  @Put('/repassword')
  async ResetPassword(@Body() resetDto: ResetDto) {
    return this.authService.resetPassword(resetDto);
  }
}
