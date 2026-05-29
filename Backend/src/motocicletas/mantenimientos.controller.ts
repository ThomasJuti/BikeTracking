import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MotocicletasService } from './motocicletas.service';

@Controller('mantenimientos')
@UseGuards(AuthGuard('jwt'))
export class MantenimientosController {
  constructor(private readonly motocicletasService: MotocicletasService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.motocicletasService.findAllMantenimientos(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: Record<string, unknown>) {
    return this.motocicletasService.createMantenimiento(req.user.id, body);
  }
}
