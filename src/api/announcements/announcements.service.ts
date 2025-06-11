import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from './models';
import { DataSource, Repository } from 'typeorm';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './dto';
import { Category } from '../categories/models';
import { PaginationArgs } from '../../common/dto';

@Injectable()
export class AnnouncementsService {
    private logger = new Logger(AnnouncementsService.name);

    constructor(
        @InjectRepository(Announcement)
        private announcementRepository: Repository<Announcement>,
        private dataSource: DataSource,
    ) {}

    public async findOne(id: number): Promise<Announcement> {
        return await this.announcementRepository.findOneOrFail({
            where: { id },
        });
    }

    public async find({
        limit,
        offset,
    }: PaginationArgs): Promise<Announcement[]> {
        return await this.announcementRepository.find({
            skip: offset,
            take: limit,
            order: {
                id: 'asc',
            },
        });
    }

    public async create(input: CreateAnnouncementInput): Promise<Announcement> {
        const { categoryIds, ...announcement } = input;

        const categories = categoryIds.map((categoryId) => {
            const category = new Category();

            category.id = categoryId;

            return category;
        });

        return await this.dataSource.transaction(async (transaction) => {
            const { id } = await transaction.save(Announcement, {
                ...announcement,
                categories,
            });

            return transaction.findOneOrFail(Announcement, {
                where: { id },
            });
        });
    }

    public async update(input: UpdateAnnouncementInput): Promise<Announcement> {
        const { categoryIds, ...announcement } = input;

        const categories = categoryIds?.length
            ? categoryIds.map((categoryId) => {
                  const category = new Category();

                  category.id = categoryId;

                  return category;
              })
            : null;

        return await this.dataSource.transaction(async (transaction) => {
            await transaction.save(Announcement, {
                ...announcement,
                updatedAt: new Date(),
                ...(categories && { categories }),
            });

            return transaction.findOneOrFail(Announcement, {
                where: { id: announcement.id },
            });
        });
    }

    public async delete(id: number): Promise<boolean> {
        if (!(await this.announcementRepository.exists({ where: { id } }))) {
            throw new NotFoundException('Announcement does not exist');
        }

        await this.announcementRepository.delete({ id });

        return true;
    }
}
