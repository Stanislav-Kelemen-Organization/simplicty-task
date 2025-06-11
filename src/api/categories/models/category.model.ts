import {
    Column,
    CreateDateColumn,
    Entity, JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Announcement } from '../../announcements/models';

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

    @ManyToMany(() => Announcement, {
        onDelete: 'RESTRICT',
    })
    @JoinTable({ name: 'announcement_to_category' })
    announcements?: Announcement[];
}
