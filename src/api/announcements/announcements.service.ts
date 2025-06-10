import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
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
        try {
            return await this.announcementRepository.findOneOrFail({
                where: { id },
            });
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Announcement fetch failed',
            });
        }
    }

    public async find({
        limit,
        offset,
    }: PaginationArgs): Promise<Announcement[]> {
        try {
            return await this.announcementRepository.find({
                skip: offset,
                take: limit,
                order: {
                    id: 'asc',
                },
            });
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Announcements fetch failed',
            });
        }
    }

    public async create(input: CreateAnnouncementInput): Promise<Announcement> {
        const { categoryIds, ...announcement } = input;

        if (!categoryIds?.length) {
            throw new BadRequestException('Categories can not be empty');
        }

        try {
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
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Announcement creation failed',
            });
        }
    }

    public async update(input: UpdateAnnouncementInput): Promise<Announcement> {
        try {
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
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Announcement update failed',
            });
        }
    }

    public async delete(id: number): Promise<boolean> {
        if (!(await this.announcementRepository.exists({ where: { id } }))) {
            throw new BadRequestException('Announcement does not exist');
        }

        try {
            await this.announcementRepository.delete({ id });
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Announcement deletion failed',
            });
        }

        return true;
    }
}
