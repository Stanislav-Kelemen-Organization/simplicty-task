import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAnnouncementInput {
    @Field()
    title: string;

    @Field()
    content: string;

    @Field()
    publishedAt: Date;

    @Field(() => [Int])
    categoryIds: number[];
}
