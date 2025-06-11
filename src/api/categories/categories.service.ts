import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Category } from './models';
import { CreateCategoryInput } from './dto';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        private dataSource: DataSource,
    ) {}

    public async find(): Promise<Category[]> {
        return await this.categoryRepository.find();
    }

    public async create(input: CreateCategoryInput): Promise<Category> {
        return await this.categoryRepository.save(input);
    }

    public async update(input: UpdateCategoryInput): Promise<Category> {
        return await this.dataSource.transaction(async (transaction) => {
            const isCategoryExisting = await transaction.exists(Category, {
                where: { id: input.id },
            });

            if (!isCategoryExisting) {
                throw new NotFoundException('Category does not exist');
            }

            const { id } = await transaction.save(Category, {
                ...input,
                updatedAt: new Date(),
            });

            return transaction.findOneOrFail(Category, {
                where: { id },
            });
        });
    }

    public async delete(id: number): Promise<boolean> {
        if (!(await this.categoryRepository.exists({ where: { id } }))) {
            throw new NotFoundException('Category does not exist');
        }

        await this.categoryRepository.delete({ id });

        return true;
    }
}
