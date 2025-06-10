import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './models';
import { AnnouncementsResolver } from './announcements.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Announcement])],
    providers: [AnnouncementsService, AnnouncementsResolver],
})
export class AnnouncementsModule {}
