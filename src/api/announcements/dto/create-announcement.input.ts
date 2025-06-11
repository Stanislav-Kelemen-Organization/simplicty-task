import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateAnnouncementInput {
    @Field()
    @IsNotEmpty()
    title: string;

    @Field()
    @IsNotEmpty()
    content: string;

    @Field()
    publishedAt: Date;

    @Field(() => [Int])
    @ArrayNotEmpty()
    categoryIds: number[];
}
