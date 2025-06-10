import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Category } from './models';
import { CreateCategoryInput } from './dto';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoriesService {
    private logger = new Logger(CategoriesService.name);

    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        private dataSource: DataSource,
    ) {}

    public async find(): Promise<Category[]> {
        try {
            return await this.categoryRepository.find();
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Categories fetch failed',
            });
        }
    }

    public async create(input: CreateCategoryInput): Promise<Category> {
        try {
            return await this.categoryRepository.save(input);
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Category creation failed',
            });
        }
    }

    public async update(input: UpdateCategoryInput): Promise<Category> {
        try {
            return await this.dataSource.transaction(async (transaction) => {
                const { id } = await transaction.save(Category, {
                    ...input,
                    updatedAt: new Date(),
                });

                return transaction.findOneOrFail(Category, {
                    where: { id },
                });
            });
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Category update failed',
            });
        }
    }

    public async delete(id: number): Promise<boolean> {
        if (!(await this.categoryRepository.exists({ where: { id } }))) {
            throw new BadRequestException('Category does not exist');
        }

        try {
            await this.categoryRepository.delete({ id });
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException({
                message: 'Category deletion failed',
            });
        }

        return true;
    }
}
