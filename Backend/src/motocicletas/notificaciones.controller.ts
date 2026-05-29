import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
@UseGuards(AuthGuard('jwt'))
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('mantenimiento')
  getMaintenanceAlerts(@Req() req: { user: { id: string } }) {
    return this.notificacionesService.getMaintenanceAlerts(req.user.id);
  }
}
