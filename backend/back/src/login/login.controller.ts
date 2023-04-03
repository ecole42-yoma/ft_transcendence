import { Body, Controller, Get, HttpCode, Logger, Post, Query, Redirect, Req, Res, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import config from 'config';
import * as cookieParser from 'cookie-parser';
import { AuthService } from 'src/auth/auth.service';
import { Jwt2faAuthGuard } from 'src/auth/jwt-2fa/jwt-2fa-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { LocalAuthGuard } from 'src/auth/local/local-auth.guard';
import { PasswordDto } from 'src/user/dto/PasswordDto';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';
import { Request } from 'express';

@Controller('login')
export class LoginController {
	constructor(
		private authService: AuthService,
		private userService: UserService,
		) {
	}

	// intra sign in. redirect to /oath/callback.
	@Get('/oauth')
	@Redirect('https://api.intra.42.fr/oauth/authorize?client_id=' + config.get<string>('intra.client_id') + '&redirect_uri=' + config.get<string>('intra.redirect_uri') + '&response_type=code', 302)
	intra(){
		Logger.log('redir');
	}
	
	// intraSignIn will return accessToken with 2fa redirection condition.
	// frontend need to redirect user to 2fa auth page.
	@Get('/oauth/callback')
	async intraSignIn(@Res() res: Response, @Query('code') code: string) {
		Logger.log(`here1`);
		const user = await this.authService.intraSignIn(code);
		Logger.log(`here2`);
		const { access_token, refresh_token } = await this.authService.login(user);
		Logger.log(`here3`);
		res.cookie('refresh_token', refresh_token, { httpOnly: true });
		Logger.log(`here4`);
		if (user.twoFactorEnabled) {
			return { ...access_token, redirect: true };
		}
		Logger.log(`access = ${access_token.accessToken}`);
		return { ...access_token, redirect: false };
	}


	@Post('/oauth/refresh')
	async refreshTokens(@Req() req: Request) {
		const refreshToken = req.cookies.refresh_token; 
		return this.authService.reissuanceAccessToken(refreshToken);
	}

	// login with email & password.
	@Post('/email')
	@UseGuards(LocalAuthGuard)
	loginWithEmail(@Req() request) {
		if (request.user.twoFactorEnabled) {
			throw new UnauthorizedException('2fa required.');
		}
		return this.authService.genAccessToken(request.user, false);
	}

	@Post('/setpw')
	@UseGuards(Jwt2faAuthGuard)
	async setPw(
		@Req() request,
		@Body(ValidationPipe) pw:PasswordDto,
	) {
		await this.userService.setUserPw(request.user, pw);
	}

	// for debug
	@Get('/user')
	showUsers() {
		return this.userService.showUsers();
	}

	// When toggleTwoFactor returns qrcode, user should verify OTP code through /2fa/auth/confirm.
	// Otherwise, user's twoFactorEnabled value does not change.
	@Get('/2fa/toggle')
	@UseGuards(JwtAuthGuard)
	async toggleTwoFactor(@Req() request) {
		return await this.authService.toggleTwoFactor(request.user.uid);
	}

	@Post('/2fa/toggle/confirm')
	@UseGuards(JwtAuthGuard)
	async authConfirm(@Req() request, @Body() body) {
		Logger.log('2fa toggle confirm');
	  const isCodeValid = await this.authService.isTwoFactorCodeValid(
			body.twoFactorCode,
			request.user,
			);
	  if (!isCodeValid) {
			Logger.log('2fa confirmation failed. try again.');
			throw new UnauthorizedException('Wrong authentication code');
	  }
		const user = request.user;
		user.twoFactorEnabled = true;
		await this.userService.updateUser(user);
	  return await this.authService.loginWith2fa(request.user);
	}

	// /2fa/auth will return new accessToken.
	@Post('/2fa/auth')
	@UseGuards(JwtAuthGuard)
	async auth(@Req() request, @Body() body) {
		Logger.log('trying 2fa login');
	  const isCodeValid = await this.authService.isTwoFactorCodeValid(
			body.twoFactorCode,
			request.user,
		);	
	  if (!isCodeValid) {
			throw new UnauthorizedException('Wrong authentication code');
	  }
	  return this.authService.loginWith2fa(request.user);
	}

}

