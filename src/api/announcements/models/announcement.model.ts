import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.model';
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
  @ManyToMany(() => Category)
  @JoinTable({ name: 'announcement_to_category' })
  categories: Category[]
}
