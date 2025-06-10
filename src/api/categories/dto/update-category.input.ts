import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateCategoryInput } from '.';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
    @Field(() => Int)
    id: number;
}
