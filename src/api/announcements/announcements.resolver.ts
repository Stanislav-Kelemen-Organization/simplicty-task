import { Resolver } from '@nestjs/graphql';
import { Announcement } from './models/announcement.model';
import { AnnouncementsService } from './announcements.service';

@Resolver(() => Announcement)
export class AnnouncementsResolver {
  constructor(
    private announcementsService: AnnouncementsService,
  ) {
  }
}
