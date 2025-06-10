import {
    getDataSourceToken,
    getEntityManagerToken,
    getRepositoryToken,
} from '@nestjs/typeorm';
import { Announcement } from './models';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AnnouncementsResolver } from './announcements.resolver';
import { AnnouncementsService } from './announcements.service';
import {
    BadRequestException,
    INestApplication,
    InternalServerErrorException,
} from '@nestjs/common';
import { PaginationArgs } from 'src/common/dto';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './dto';

describe('AnnouncementsService', () => {
    let app: INestApplication;
    let service: AnnouncementsService;
    let announcementRepository: jest.Mocked<Repository<Announcement>>;
    let dataSource: jest.Mocked<DataSource>;
    let transactionManager: jest.Mocked<EntityManager>;

    const mockAnnouncement: Announcement = {
        id: 1,
        title: 'Downtown Road Closures',
        content:
            'Several streets will be closed due to the marathon this weekend. Plan alternate routes.',
        publishedAt: new Date('2023-08-11T04:38:00.000Z'),
        createdAt: new Date('2025-06-10T18:48:45.581Z'),
        updatedAt: new Date('2025-06-10T18:48:45.581Z'),
        categories: [
            {
                id: 1,
                name: 'City',
                createdAt: new Date('2025-06-10T18:48:45.581Z'),
                updatedAt: new Date('2025-06-10T18:48:45.581Z'),
            },
        ],
    };

    beforeEach(async () => {
        const mockRepository = {
            findOneOrFail: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
        };

        const mockTransactionManager = {
            save: jest.fn(),
            findOneOrFail: jest.fn(),
        };

        const mockDataSource = {
            transaction: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnnouncementsService,
                AnnouncementsResolver,
                {
                    provide: getRepositoryToken(Announcement),
                    useValue: mockRepository,
                },
                {
                    provide: getDataSourceToken(),
                    useValue: mockDataSource,
                },
                {
                    provide: getEntityManagerToken(),
                    useValue: mockTransactionManager,
                },
            ],
        }).compile();

        service = module.get<AnnouncementsService>(AnnouncementsService);
        announcementRepository = module.get(getRepositoryToken(Announcement));
        dataSource = module.get(DataSource);
        transactionManager = module.get(EntityManager);
        app = module.createNestApplication({
            logger: false,
        });

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('should return by id', async () => {
            announcementRepository.findOneOrFail.mockResolvedValue(
                mockAnnouncement,
            );

            const result = await service.findOne(1);

            expect(result).toEqual(mockAnnouncement);
            expect(
                announcementRepository['findOneOrFail'],
            ).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should throw InternalServerErrorException when repository throws error', async () => {
            const error = new Error('Database error');
            announcementRepository['findOneOrFail'].mockRejectedValue(error);

            await expect(service.findOne(1)).rejects.toThrow(
                InternalServerErrorException,
            );
            await expect(service.findOne(1)).rejects.toThrow(
                'Announcement fetch failed',
            );
        });
    });

    describe('find', () => {
        const paginationArgs: PaginationArgs = {
            limit: 10,
            offset: 0,
        };

        it('should return announcements with pagination', async () => {
            const announcements = [mockAnnouncement];
            announcementRepository['find'].mockResolvedValue(announcements);

            const result = await service.find(paginationArgs);

            expect(result).toEqual(announcements);
            expect(announcementRepository['find']).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                order: {
                    id: 'asc',
                },
            });
        });

        it('should throw InternalServerErrorException when repository throws error', async () => {
            const error = new Error('Database error');
            announcementRepository['find'].mockRejectedValue(error);

            await expect(service.find(paginationArgs)).rejects.toThrow(
                InternalServerErrorException,
            );
            await expect(service.find(paginationArgs)).rejects.toThrow(
                'Announcements fetch failed',
            );
        });
    });

    describe('create', () => {
        const createInput: CreateAnnouncementInput = {
            title: 'New Announcement',
            content: 'New content',
            categoryIds: [1, 2],
            publishedAt: new Date(),
        };

        it('should create an announcement successfully', async () => {
            const savedAnnouncement = { ...mockAnnouncement, id: 1 };

            transactionManager['save'].mockResolvedValue({ id: 1 });
            transactionManager['findOneOrFail'].mockResolvedValue(
                savedAnnouncement,
            );
            dataSource['transaction'].mockImplementation(
                (callback: any): Promise<any> =>
                    (
                        callback as unknown as (
                            transactionManager: EntityManager,
                        ) => Promise<any>
                    )(transactionManager),
            );

            const result = await service.create(createInput);

            expect(result).toEqual(savedAnnouncement);
            expect(dataSource['transaction']).toHaveBeenCalled();
            expect(transactionManager['save']).toHaveBeenCalledWith(
                Announcement,
                expect.objectContaining({
                    title: 'New Announcement',
                    content: 'New content',
                    categories: expect.arrayContaining([
                        expect.objectContaining({ id: 1 }),
                        expect.objectContaining({ id: 2 }),
                    ]) as any[],
                }),
            );
            expect(transactionManager['findOneOrFail']).toHaveBeenCalledWith(
                Announcement,
                {
                    where: { id: 1 },
                },
            );
        });

        it('should throw BadRequestException when categoryIds is empty', async () => {
            const inputWithoutCategories = {
                ...createInput,
                categoryIds: [],
            };

            await expect(
                service.create(inputWithoutCategories),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.create(inputWithoutCategories),
            ).rejects.toThrow('Categories can not be empty');
        });

        it('should throw BadRequestException when categoryIds is undefined', async () => {
            const inputWithoutCategories = {
                ...createInput,
                categoryIds: undefined,
            };

            await expect(
                service.create(
                    inputWithoutCategories as unknown as CreateAnnouncementInput,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException when transaction fails', async () => {
            const error = new Error('Transaction error');
            dataSource['transaction'].mockRejectedValue(error);

            await expect(service.create(createInput)).rejects.toThrow(
                InternalServerErrorException,
            );
            await expect(service.create(createInput)).rejects.toThrow(
                'Announcement creation failed',
            );
        });
    });

    describe('update', () => {
        const updateInput: UpdateAnnouncementInput = {
            id: 1,
            title: 'Updated Announcement',
            content: 'Updated content',
            categoryIds: [1, 3],
        };

        it('should update an announcement successfully with categories', async () => {
            const updatedAnnouncement = { ...mockAnnouncement, ...updateInput };

            transactionManager['save'].mockResolvedValue(undefined);
            transactionManager['findOneOrFail'].mockResolvedValue(
                updatedAnnouncement,
            );
            dataSource['transaction'].mockImplementation((callback: any) =>
                (
                    callback as unknown as (
                        transactionManager: EntityManager,
                    ) => Promise<any>
                )(transactionManager),
            );

            const result = await service.update(updateInput);

            expect(result).toEqual(updatedAnnouncement);
            expect(dataSource['transaction']).toHaveBeenCalled();
            expect(transactionManager['save']).toHaveBeenCalledWith(
                Announcement,
                expect.objectContaining({
                    id: 1,
                    title: 'Updated Announcement',
                    content: 'Updated content',
                    updatedAt: expect.any(Date) as Date,
                    categories: expect.anything() as any[],
                }),
            );
        });

        it('should update an announcement without categories', async () => {
            const updateInputWithoutCategories = {
                id: 1,
                title: 'Updated Announcement',
                content: 'Updated content',
                categoryIds: [],
            };
            const updatedAnnouncement = {
                ...mockAnnouncement,
                ...updateInputWithoutCategories,
            };

            transactionManager.save.mockResolvedValue(undefined);
            transactionManager.findOneOrFail.mockResolvedValue(
                updatedAnnouncement,
            );
            dataSource.transaction.mockImplementation((callback) =>
                (
                    callback as unknown as (
                        transactionManager: EntityManager,
                    ) => Promise<any>
                )(transactionManager),
            );

            const result = await service.update(updateInputWithoutCategories);

            expect(result).toEqual(updatedAnnouncement);
            expect(transactionManager['save']).toHaveBeenCalledWith(
                Announcement,
                expect.objectContaining({
                    id: 1,
                    title: 'Updated Announcement',
                    content: 'Updated content',
                    updatedAt: expect.any(Date) as Date,
                }),
            );
            expect(transactionManager['save']).not.toHaveBeenCalledWith(
                Announcement,
                expect.objectContaining({
                    categories: expect.anything() as any[],
                }),
            );
        });

        it('should throw InternalServerErrorException when transaction fails', async () => {
            const error = new Error('Transaction error');
            dataSource.transaction.mockRejectedValue(error);

            await expect(service.update(updateInput)).rejects.toThrow(
                InternalServerErrorException,
            );
            await expect(service.update(updateInput)).rejects.toThrow(
                'Announcement update failed',
            );
        });
    });

    describe('delete', () => {
        it('should delete a announcement and return true', async () => {
            announcementRepository['delete'].mockResolvedValue({
                affected: 1,
                raw: {},
            });

            announcementRepository['exists'].mockResolvedValue(true);

            const result = await service.delete(1);

            expect(result).toBe(true);
            expect(announcementRepository['delete']).toHaveBeenCalledWith({
                id: 1,
            });
            expect(announcementRepository['delete']).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when announcement does not exists', async () => {
            announcementRepository['exists'].mockResolvedValue(false);

            await expect(service.delete(1)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.delete(1)).rejects.toThrow(
                'Announcement does not exist',
            );
            expect(announcementRepository['exists']).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw InternalServerErrorException when deletion fails', async () => {
            const error = new Error('Foreign key constraint violation');

            announcementRepository['delete'].mockRejectedValue(error);
            announcementRepository['exists'].mockResolvedValue(true);

            await expect(service.delete(1)).rejects.toThrow(
                InternalServerErrorException,
            );
            await expect(service.delete(1)).rejects.toThrow(
                'Announcement deletion failed',
            );
            expect(announcementRepository['delete']).toHaveBeenCalledWith({
                id: 1,
            });
        });
    });
});
