import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MysqlService } from '../database/mysql.service';
import { MantenimientosController } from './mantenimientos.controller';
import { MotosController } from './motos.controller';
import { MotocicletasService } from './motocicletas.service';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [MotosController, MantenimientosController, NotificacionesController],
  providers: [MysqlService, MotocicletasService, NotificacionesService],
  exports: [MotocicletasService, NotificacionesService],
})
export class MotocicletasModule {}
