import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsResolver } from './announcements.resolver';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './models';
import { Category } from '../categories/models';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './dto';
import { IdArgs, PaginationArgs } from '../../common/dto';
import { INestApplication } from '@nestjs/common';

describe('AnnouncementsResolver', () => {
    let app: INestApplication;
    let resolver: AnnouncementsResolver;
    let service: jest.Mocked<AnnouncementsService>;

    const mockCategory: Category = {
        id: 1,
        name: 'Test Category',
    } as Category;

    const mockAnnouncement: Announcement = {
        id: 1,
        title: 'Test Announcement',
        content: 'Test content',
        categories: [mockCategory],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
    } as Announcement;

    const mockAnnouncementsList: Announcement[] = [
        mockAnnouncement,
        {
            id: 2,
            title: 'Second Announcement',
            content: 'Second content',
            categories: [mockCategory],
            createdAt: new Date('2023-01-02T00:00:00Z'),
            updatedAt: new Date('2023-01-02T00:00:00Z'),
        } as Announcement,
    ];

    beforeEach(async () => {
        const mockService = {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnnouncementsResolver,
                {
                    provide: AnnouncementsService,
                    useValue: mockService,
                },
            ],
        }).compile();

        resolver = module.get<AnnouncementsResolver>(AnnouncementsResolver);
        service = module.get(AnnouncementsService);
        app = module.createNestApplication({
            logger: false,
        });

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('announcement query', () => {
        it('should return a single announcement by id', async () => {
            service['findOne'].mockResolvedValue(mockAnnouncement);

            const result = await resolver.announcement(1);

            expect(result).toEqual(mockAnnouncement);
            expect(service['findOne']).toHaveBeenCalledWith(1);
            expect(service['findOne']).toHaveBeenCalledTimes(1);
        });
    });

    describe('announcements query', () => {
        const paginationArgs: PaginationArgs = {
            limit: 10,
            offset: 0,
        };

        it('should return a list of announcements with pagination', async () => {
            service['find'].mockResolvedValue(mockAnnouncementsList);

            const result = await resolver.announcements(paginationArgs);

            expect(result).toEqual(mockAnnouncementsList);
            expect(service['find']).toHaveBeenCalledWith(paginationArgs);
            expect(service['find']).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no announcements found', async () => {
            service['find'].mockResolvedValue([]);

            const result = await resolver.announcements(paginationArgs);

            expect(result).toEqual([]);
            expect(service['find']).toHaveBeenCalledWith(paginationArgs);
        });
    });

    describe('createAnnouncement mutation', () => {
        const createInput: CreateAnnouncementInput = {
            title: 'New Announcement',
            content: 'New content',
            categoryIds: [1, 2],
            publishedAt: new Date(),
        };

        it('should create and return a new announcement', async () => {
            const createdAnnouncement = {
                ...mockAnnouncement,
                title: 'New Announcement',
                content: 'New content',
            };
            service['create'].mockResolvedValue(createdAnnouncement);

            const result = await resolver.createAnnouncement(createInput);

            expect(result).toEqual(createdAnnouncement);
            expect(service['create']).toHaveBeenCalledWith(createInput);
            expect(service['create']).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateAnnouncement mutation', () => {
        const updateInput: UpdateAnnouncementInput = {
            id: 1,
            title: 'Updated Announcement',
            content: 'Updated content',
            categoryIds: [1, 3],
        };

        it('should update and return the announcement', async () => {
            const updatedAnnouncement = {
                ...mockAnnouncement,
                title: 'Updated Announcement',
                content: 'Updated content',
            };
            service['update'].mockResolvedValue(updatedAnnouncement);

            const result = await resolver.updateAnnouncement(updateInput);

            expect(result).toEqual(updatedAnnouncement);
            expect(service['update']).toHaveBeenCalledWith(updateInput);
            expect(service['update']).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteAnnouncement mutation', () => {
        const deleteArgs: IdArgs = { id: 1 };

        it('should delete announcement and return true', async () => {
            service['delete'].mockResolvedValue(true);

            const result = await resolver.deleteAnnouncement(deleteArgs);

            expect(result).toBe(true);
            expect(service['delete']).toHaveBeenCalledWith(1);
            expect(service['delete']).toHaveBeenCalledTimes(1);
        });
    });

    describe('constructor', () => {
        it('should inject AnnouncementsService correctly', () => {
            expect(resolver).toBeDefined();
            expect(resolver['announcementsService']).toBeDefined();
        });
    });
});
