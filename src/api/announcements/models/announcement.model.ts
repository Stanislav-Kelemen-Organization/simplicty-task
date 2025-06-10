import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.model';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 1000 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => Category)
  @JoinTable({ name: 'announcement_to_category' })
  categories: Category[]
}
