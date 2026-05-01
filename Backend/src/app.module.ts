import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MotocicletasModule } from './motocicletas/motocicletas.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [MotocicletasModule, AuthModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
