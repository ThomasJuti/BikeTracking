import { Module } from '@nestjs/common';
import { MysqlService } from '../database/mysql.service';
import { MantenimientosController } from './mantenimientos.controller';
import { MotosController } from './motos.controller';
import { MotocicletasService } from './motocicletas.service';

@Module({
  controllers: [MotosController, MantenimientosController],
  providers: [MysqlService, MotocicletasService],
  exports: [MotocicletasService],
})
export class MotocicletasModule {}
