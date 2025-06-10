import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';
import { Category } from './models';
import { CreateCategoryInput } from './dto';
import { UpdateCategoryInput } from './dto/update-category.input';
import { IdArgs } from '../../common/dto';
import { INestApplication } from '@nestjs/common';

describe('CategoriesResolver', () => {
    let app: INestApplication;
    let resolver: CategoriesResolver;
    let service: CategoriesService;

    const mockCategory: Category = {
        id: 1,
        name: 'Test Category',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockCategories: Category[] = [
        mockCategory,
        {
            id: 2,
            name: 'Another Category',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    const mockCreateInput: CreateCategoryInput = {
        name: 'New Category',
    };

    const mockUpdateInput: UpdateCategoryInput = {
        id: 1,
        name: 'Updated Category',
    };

    const mockIdArgs: IdArgs = {
        id: 1,
    };

    const mockCategoriesService = {
        find: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesResolver,
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
                },
            ],
        }).compile();

        resolver = module.get<CategoriesResolver>(CategoriesResolver);
        service = module.get<CategoriesService>(CategoriesService);
        app = module.createNestApplication({
            logger: false,
        });

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
        expect(service).toBeDefined();
    });

    describe('categories', () => {
        it('should return an array of categories', async () => {
            mockCategoriesService.find.mockResolvedValue(mockCategories);

            const result = await resolver.categories();

            expect(result).toEqual(mockCategories);
            expect(mockCategoriesService.find).toHaveBeenCalledTimes(1);
            expect(mockCategoriesService.find).toHaveBeenCalledWith();
        });
    });

    describe('createCategory', () => {
        it('should create and return a new category', async () => {
            mockCategoriesService.create.mockResolvedValue(mockCategory);

            const result = await resolver.createCategory(mockCreateInput);

            expect(result).toEqual(mockCategory);
            expect(mockCategoriesService.create).toHaveBeenCalledTimes(1);
            expect(mockCategoriesService.create).toHaveBeenCalledWith(
                mockCreateInput,
            );
        });
    });

    describe('updateCategory', () => {
        it('should update and return the category', async () => {
            const updatedCategory = { ...mockCategory, ...mockUpdateInput };
            mockCategoriesService.update.mockResolvedValue(updatedCategory);

            const result = await resolver.updateCategory(mockUpdateInput);

            expect(result).toEqual(updatedCategory);
            expect(mockCategoriesService.update).toHaveBeenCalledTimes(1);
            expect(mockCategoriesService.update).toHaveBeenCalledWith(
                mockUpdateInput,
            );
        });
    });

    describe('deleteCategory', () => {
        it('should delete category and return true', async () => {
            mockCategoriesService.delete.mockResolvedValue(true);

            const result = await resolver.deleteCategory(mockIdArgs);

            expect(result).toBe(true);
            expect(mockCategoriesService.delete).toHaveBeenCalledTimes(1);
            expect(mockCategoriesService.delete).toHaveBeenCalledWith(
                mockIdArgs.id,
            );
        });
    });

    describe('service integration', () => {
        it('should call service methods with correct parameters', async () => {
            mockCategoriesService.find.mockResolvedValue(mockCategories);
            mockCategoriesService.create.mockResolvedValue(mockCategory);
            mockCategoriesService.update.mockResolvedValue(mockCategory);
            mockCategoriesService.delete.mockResolvedValue(true);

            await resolver.categories();
            await resolver.createCategory(mockCreateInput);
            await resolver.updateCategory(mockUpdateInput);
            await resolver.deleteCategory(mockIdArgs);

            expect(mockCategoriesService.find).toHaveBeenCalledWith();
            expect(mockCategoriesService.create).toHaveBeenCalledWith(
                mockCreateInput,
            );
            expect(mockCategoriesService.update).toHaveBeenCalledWith(
                mockUpdateInput,
            );
            expect(mockCategoriesService.delete).toHaveBeenCalledWith(
                mockIdArgs.id,
            );
        });
    });
});
