import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CategoriesService } from '../categories.service';
import { Category } from '../models';
import { CreateCategoryInput } from '../dto';
import { UpdateCategoryInput } from '../dto/update-category.input';
import { appSetup } from '../../../utils';

describe('CategoriesService', () => {
    let app: INestApplication;
    let service: CategoriesService;
    let categoryRepository: jest.Mocked<Repository<Category>>;
    let dataSource: jest.Mocked<DataSource>;
    let transactionManager: jest.Mocked<EntityManager>;

    const mockCategory: Category = {
        id: 1,
        name: 'Test Category',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
    } as Category;

    const mockCategories: Category[] = [
        mockCategory,
        {
            id: 2,
            name: 'Second Category',
            createdAt: new Date('2023-01-02T00:00:00Z'),
            updatedAt: new Date('2023-01-02T00:00:00Z'),
        } as Category,
    ];

    beforeEach(async () => {
        const mockTransactionManager = {
            save: jest.fn(),
            findOneOrFail: jest.fn(),
            exists: jest.fn(),
        };

        const mockRepository = {
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
        };

        const mockDataSource = {
            transaction: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: getRepositoryToken(Category),
                    useValue: mockRepository,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
                {
                    provide: EntityManager,
                    useValue: mockTransactionManager,
                },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        categoryRepository = module.get(getRepositoryToken(Category));
        dataSource = module.get(DataSource);
        transactionManager = module.get(EntityManager);
        app = module.createNestApplication({
            logger: false,
        });

        appSetup(app);

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('find', () => {
        it('should return all categories', async () => {
            categoryRepository['find'].mockResolvedValue(mockCategories);

            const result = await service.find();

            expect(result).toEqual(mockCategories);
            expect(categoryRepository['find']).toHaveBeenCalledWith();
            expect(categoryRepository['find']).toHaveBeenCalledTimes(1);
        });

        it('should throw error when repository throws error', async () => {
            const error = new Error('Database connection failed');
            categoryRepository['find'].mockRejectedValue(error);

            await expect(service.find()).rejects.toThrow(error);
            await expect(service.find()).rejects.toThrow(
                'Database connection failed',
            );
            expect(categoryRepository['find']).toHaveBeenCalledWith();
        });
    });

    describe('create', () => {
        const createInput: CreateCategoryInput = {
            name: 'New Category',
        };

        it('should create and return a new category', async () => {
            const savedCategory = { ...mockCategory, ...createInput };
            categoryRepository['save'].mockResolvedValue(savedCategory);

            const result = await service.create(createInput);

            expect(result).toEqual(savedCategory);
            expect(categoryRepository['save']).toHaveBeenCalledWith(
                createInput,
            );
            expect(categoryRepository['save']).toHaveBeenCalledTimes(1);
        });

        it('should throw error when save fails', async () => {
            const error = new Error('Duplicate key violation');
            categoryRepository['save'].mockRejectedValue(error);

            await expect(service.create(createInput)).rejects.toThrow(error);
            await expect(service.create(createInput)).rejects.toThrow(
                'Duplicate key violation',
            );
            expect(categoryRepository['save']).toHaveBeenCalledWith(
                createInput,
            );
        });
    });

    describe('update', () => {
        const updateInput: UpdateCategoryInput = {
            id: 1,
            name: 'Updated Category',
        };

        it('should update and return the category', async () => {
            const updatedCategory = { ...mockCategory, ...updateInput };

            transactionManager['save'].mockResolvedValue({ id: 1 });
            transactionManager['exists'].mockResolvedValue(true);
            transactionManager['findOneOrFail'].mockResolvedValue(
                updatedCategory,
            );
            dataSource['transaction'].mockImplementation((callback) =>
                (
                    callback as unknown as (
                        transactionManager: EntityManager,
                    ) => Promise<any>
                )(transactionManager),
            );

            const result = await service.update(updateInput);

            expect(result).toEqual(updatedCategory);
            expect(dataSource['transaction']).toHaveBeenCalled();
            expect(transactionManager['save']).toHaveBeenCalledWith(
                Category,
                expect.objectContaining({
                    id: 1,
                    name: 'Updated Category',
                    updatedAt: expect.any(Date) as Date,
                }),
            );
            expect(transactionManager['findOneOrFail']).toHaveBeenCalledWith(
                Category,
                {
                    where: { id: 1 },
                },
            );
        });

        it('should throw error when transaction fails', async () => {
            const error = new Error('Transaction rollback');
            dataSource['transaction'].mockRejectedValue(error);

            await expect(service.update(updateInput)).rejects.toThrow(error);
            await expect(service.update(updateInput)).rejects.toThrow(
                'Transaction rollback',
            );
            expect(dataSource['transaction']).toHaveBeenCalled();
        });

        it('should set updatedAt to current date', async () => {
            const beforeUpdate = new Date();

            transactionManager['save'].mockResolvedValue({ id: 1 });
            transactionManager['exists'].mockResolvedValue(true);
            transactionManager['findOneOrFail'].mockResolvedValue(mockCategory);
            dataSource['transaction'].mockImplementation((callback) =>
                (
                    callback as unknown as (
                        transactionManager: EntityManager,
                    ) => Promise<any>
                )(transactionManager),
            );

            await service.update(updateInput);

            const afterUpdate = new Date();
            const saveCall = transactionManager['save'].mock.calls[0][1] as {
                updatedAt: Date;
            };

            expect(saveCall.updatedAt).toBeInstanceOf(Date);
            expect(saveCall.updatedAt.getTime()).toBeGreaterThanOrEqual(
                beforeUpdate.getTime(),
            );
            expect(saveCall.updatedAt.getTime()).toBeLessThanOrEqual(
                afterUpdate.getTime(),
            );
        });
    });

    describe('delete', () => {
        it('should delete a category and return true', async () => {
            categoryRepository['delete'].mockResolvedValue({
                affected: 1,
                raw: {},
            });

            categoryRepository['exists'].mockResolvedValue(true);

            const result = await service.delete(1);

            expect(result).toBe(true);
            expect(categoryRepository['delete']).toHaveBeenCalledWith({
                id: 1,
            });
            expect(categoryRepository['delete']).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when category does not exists', async () => {
            categoryRepository['exists'].mockResolvedValue(false);

            await expect(service.delete(1)).rejects.toThrow(NotFoundException);
            await expect(service.delete(1)).rejects.toThrow(
                'Category does not exist',
            );
            expect(categoryRepository['exists']).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw error when deletion fails', async () => {
            const error = new Error('Foreign key constraint violation');
            categoryRepository['delete'].mockRejectedValue(error);

            categoryRepository['exists'].mockResolvedValue(true);

            await expect(service.delete(1)).rejects.toThrow(error);
            await expect(service.delete(1)).rejects.toThrow(
                'Foreign key constraint violation',
            );
            expect(categoryRepository['delete']).toHaveBeenCalledWith({
                id: 1,
            });
        });
    });

    describe('constructor and dependencies', () => {
        it('should inject repository and data source correctly', () => {
            expect(service).toBeDefined();
            expect(service['categoryRepository']).toBeDefined();
            expect(service['dataSource']).toBeDefined();
        });

        it('should initialize logger correctly', () => {
            expect(service['logger']).toBeDefined();
        });
    });
});
