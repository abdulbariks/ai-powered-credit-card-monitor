import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('api/cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  getApprovedCards() {
    return this.cardsService.getApprovedCards();
  }

  @Get(':id/history')
  getCardHistory(@Param('id') id: string) {
    const result = this.cardsService.getHistory(id);
    if (!result) {
      throw new NotFoundException(`Card '${id}' was not found.`);
    }
    return result;
  }
}
