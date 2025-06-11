import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/models';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class Announcement {
    @PrimaryGeneratedColumn()
    @Field(() => Int)
    id: number;

    @Field()
    @Column({ type: 'varchar', length: 1000 })
    title: string;

    @Field()
    @Column({ type: 'text' })
    content: string;

    @Field()
    @Column({ type: 'timestamptz', nullable: true })
    publishedAt: Date;

    @Field()
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @Field(() => [Category])
    @ManyToMany(() => Category, {
        /* eager is used for the sake of simplicity, overfetching can be reduced by using graphql @ResolveField()
        decorator on categories field + using DataLoader to avoid N + 1 problem */
        eager: true,
    })
    @JoinTable({ name: 'announcement_to_category' })
    categories: Category[];
}
