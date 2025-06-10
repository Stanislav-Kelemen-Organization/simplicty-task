import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class IdArgs {
    @Field(() => Int)
    id: number;
}
