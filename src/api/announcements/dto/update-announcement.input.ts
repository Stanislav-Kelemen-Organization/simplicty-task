import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateAnnouncementInput {
    @Field({ nullable: true })
    title?: string;

    @Field({ nullable: true })
    content?: string;

    @Field({ nullable: true })
    publishedAt?: Date;

    @Field(() => [Int], { nullable: true })
    categoryIds?: number[];

    @Field(() => Int)
    id: number;
}
