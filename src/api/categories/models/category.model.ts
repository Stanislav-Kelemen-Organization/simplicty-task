import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity()
export class Category {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Field()
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
