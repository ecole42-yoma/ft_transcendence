import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { typeORMConfig } from './configs/typeorm.config';
import { LoginModule } from './login/login.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
		TypeOrmModule.forRoot(typeORMConfig),
		AuthModule,
		UserModule,
		LoginModule,
  ],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}