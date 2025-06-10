import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './models/announcement.model';
import { Category } from './models/category.model';
import { AnnouncementsResolver } from './announcements.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, Category])
  ],
  providers: [AnnouncementsService, AnnouncementsResolver],
})
export class AnnouncementsModule {}
