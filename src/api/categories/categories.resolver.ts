import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { Category } from './models';
import { CreateCategoryInput } from './dto';
import { IdArgs } from '../../common/dto';
import { UpdateCategoryInput } from './dto/update-category.input';

@Resolver(() => Category)
export class CategoriesResolver {
    constructor(private categoriesService: CategoriesService) {}

    @Query(() => [Category])
    public categories(): Promise<Category[]> {
        return this.categoriesService.find();
    }

    @Mutation(() => Category)
    async createCategory(
        @Args({ name: 'input' }) input: CreateCategoryInput,
    ): Promise<Category> {
        return this.categoriesService.create(input);
    }

    @Mutation(() => Category)
    public updateCategory(
        @Args({ name: 'input' }) input: UpdateCategoryInput,
    ): Promise<Category> {
        return this.categoriesService.update(input);
    }

    @Mutation(() => Boolean)
    async deleteCategory(@Args() { id }: IdArgs): Promise<boolean> {
        return this.categoriesService.delete(id);
    }
}
