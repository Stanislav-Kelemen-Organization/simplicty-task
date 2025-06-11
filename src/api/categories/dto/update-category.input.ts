import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateCategoryInput {
    @Field({ nullable: true })
    name?: string;

    @Field(() => Int)
    id: number;
}
