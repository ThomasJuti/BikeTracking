import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MotocicletasService } from './motocicletas.service';

@Controller('motos')
@UseGuards(AuthGuard('jwt'))
export class MotosController {
  constructor(private readonly motocicletasService: MotocicletasService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
  ) {
    return this.motocicletasService.findAllMotos(req.user.id, q, estado);
  }

  @Get('catalogo')
  searchCatalog(@Query('q') q?: string, @Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 20;
    return this.motocicletasService.searchCatalog(q, lim);
  }

  @Get('catalogo/:id')
  findCatalogItem(@Param('id') id: string) {
    return this.motocicletasService.findCatalogItem(parseInt(id, 10));
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.motocicletasService.findOneMoto(req.user.id, id);
  }

  @Post()
  create(@Req() req: any, @Body() body: Record<string, unknown>) {
    return this.motocicletasService.createMoto(req.user.id, body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.motocicletasService.updateMoto(req.user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.motocicletasService.deleteMoto(req.user.id, id);
  }
}
