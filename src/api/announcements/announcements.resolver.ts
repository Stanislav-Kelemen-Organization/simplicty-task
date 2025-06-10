import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Announcement } from './models';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './dto';
import { IdArgs, PaginationArgs } from '../../common/dto';

@Resolver(() => Announcement)
export class AnnouncementsResolver {
    constructor(private announcementsService: AnnouncementsService) {}

    @Query(() => Announcement)
    async announcement(
        @Args({ name: 'id', type: () => Int }) id: number,
    ): Promise<Announcement> {
        return this.announcementsService.findOne(id);
    }

    @Query(() => [Announcement])
    async announcements(@Args() args: PaginationArgs): Promise<Announcement[]> {
        return this.announcementsService.find(args);
    }

    @Mutation(() => Announcement)
    async createAnnouncement(
        @Args({ name: 'input' }) input: CreateAnnouncementInput,
    ): Promise<Announcement> {
        return this.announcementsService.create(input);
    }

    @Mutation(() => Announcement)
    async updateAnnouncement(
        @Args({ name: 'input' }) input: UpdateAnnouncementInput,
    ): Promise<Announcement> {
        return this.announcementsService.update(input);
    }

    @Mutation(() => Boolean)
    async deleteAnnouncement(@Args() { id }: IdArgs): Promise<boolean> {
        return this.announcementsService.delete(id);
    }
}
