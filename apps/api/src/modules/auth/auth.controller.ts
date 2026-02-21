import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type SendCodeBody = {
  phone: string;
};

type LoginBody = {
  phone: string;
  code: string;
  appId?: string;
};

type RegisterEmailBody = {
  email: string;
  password: string;
  appId?: string;
};

type LoginEmailBody = {
  email: string;
  password: string;
  appId?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() body: SendCodeBody) {
    return this.authService.sendCode(body.phone);
  }

  @Post('login')
  login(@Body() body: LoginBody) {
    return this.authService.login(body.phone, body.code, body.appId);
  }

  @Post('register-email')
  registerEmail(@Body() body: RegisterEmailBody) {
    return this.authService.registerEmail(body.email, body.password, body.appId);
  }

  @Post('login-email')
  loginEmail(@Body() body: LoginEmailBody) {
    return this.authService.loginEmail(body.email, body.password, body.appId);
  }
}
