/* eslint @typescript-eslint/no-unsafe-member-access: 0 */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AnnouncementsModule } from '../announcements.module';
import { CategoriesModule } from '../../categories/categories.module';
import { Category } from '../../categories/models';
import { Announcement } from '../models';
import { appSetup } from '../../../utils';
import { setupDataSource } from '../../../../tests/setupDataSource';
import { print } from 'graphql';
import { gql } from 'graphql-tag';

describe('Announcements (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let createdCategoryIds: number[];
    let createdAnnouncementId: number;

    beforeAll(async () => {
        dataSource = await setupDataSource();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    entities: [Category, Announcement],
                    synchronize: true,
                }),
                AnnouncementsModule,
                CategoriesModule,
            ],
        })
            .overrideProvider(DataSource)
            .useValue(dataSource)
            .compile();

        app = moduleFixture.createNestApplication({
            logger: false,
        });

        appSetup(app);

        await app.init();

        const categoryRepository = dataSource.getRepository(Category);
        const testCategories = await categoryRepository.save([
            { name: 'Test Category 1' },
            { name: 'Test Category 2' },
        ]);

        createdCategoryIds = testCategories.map((cat) => cat.id);
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    beforeEach(async () => {
        await dataSource.getRepository(Announcement).query(`
            TRUNCATE announcement CASCADE;
        `);
    });

    describe('Create Announcement', () => {
        it('should create a new announcement', async () => {
            const createAnnouncementMutation = print(gql`
                mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
                    createAnnouncement(input: $input) {
                        id
                        title
                        content
                        publishedAt
                        createdAt
                        updatedAt
                        categories {
                            id
                            name
                        }
                    }
                }
            `);

            const input = {
                title: 'Test Announcement',
                content: 'This is a test announcement content',
                publishedAt: new Date().toISOString(),
                categoryIds: createdCategoryIds,
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: createAnnouncementMutation,
                    variables: { input },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.createAnnouncement).toBeDefined();
            expect(response.body.data.createAnnouncement.title).toBe(
                input.title,
            );
            expect(response.body.data.createAnnouncement.content).toBe(
                input.content,
            );
            expect(
                response.body.data.createAnnouncement.categories,
            ).toHaveLength(2);

            createdAnnouncementId = response.body.data.createAnnouncement.id;
        });

        it('should throw error on empty category array', async () => {
            const createAnnouncementMutation = print(gql`
                mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
                    createAnnouncement(input: $input) {
                        id
                        title
                        content
                        categories {
                            id
                        }
                    }
                }
            `);

            const input = {
                title: 'Announcement without categories',
                content: 'Content without categories',
                publishedAt: new Date().toISOString(),
                categoryIds: [],
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: createAnnouncementMutation,
                    variables: { input },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'Bad Request Exception',
            );
        });
    });

    describe('Find Announcements', () => {
        beforeEach(async () => {
            const announcementRepository =
                dataSource.getRepository(Announcement);
            const categories = createdCategoryIds.map(
                (id) => ({ id }) as Category,
            );

            await announcementRepository.save([
                {
                    title: 'First Announcement',
                    content: 'First content',
                    publishedAt: new Date(),
                    categories,
                },
                {
                    title: 'Second Announcement',
                    content: 'Second content',
                    publishedAt: new Date(),
                    categories,
                },
            ]);
        });

        it('should find all announcements with pagination', async () => {
            const findAnnouncementsQuery = print(gql`
                query FindAnnouncements($limit: Int, $offset: Int) {
                    announcements(limit: $limit, offset: $offset) {
                        id
                        title
                        content
                        categories {
                            id
                            name
                        }
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: findAnnouncementsQuery,
                    variables: {
                        pagination: { limit: 10, offset: 0 },
                    },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.announcements).toHaveLength(2);
            expect(response.body.data.announcements[0].title).toBe(
                'First Announcement',
            );
        });

        it('should handle pagination correctly', async () => {
            const findAnnouncementsQuery = print(gql`
                query FindAnnouncements($limit: Int, $offset: Int) {
                    announcements(limit: $limit, offset: $offset) {
                        id
                        title
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: findAnnouncementsQuery,
                    variables: {
                        limit: 1,
                        offset: 1,
                    },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.announcements).toHaveLength(1);
            expect(response.body.data.announcements[0].title).toBe(
                'Second Announcement',
            );
        });
    });

    describe('Find One Announcement', () => {
        beforeEach(async () => {
            const announcementRepository =
                dataSource.getRepository(Announcement);
            const categories = createdCategoryIds.map(
                (id) => ({ id }) as Category,
            );

            const announcement = await announcementRepository.save({
                title: 'Single Announcement',
                content: 'Single content',
                publishedAt: new Date(),
                categories,
            });

            createdAnnouncementId = announcement.id;
        });

        it('should find one announcement by id', async () => {
            const findOneAnnouncementQuery = print(gql`
                query FindOneAnnouncement($id: Int!) {
                    announcement(id: $id) {
                        id
                        title
                        content
                        publishedAt
                        categories {
                            id
                            name
                        }
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: findOneAnnouncementQuery,
                    variables: { id: createdAnnouncementId },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.announcement).toBeDefined();
            expect(response.body.data.announcement.id).toBe(
                createdAnnouncementId,
            );
            expect(response.body.data.announcement.title).toBe(
                'Single Announcement',
            );
        });

        it('should return error for non-existent announcement', async () => {
            const findOneAnnouncementQuery = print(gql`
                query FindOneAnnouncement($id: Int!) {
                    announcement(id: $id) {
                        id
                        title
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: findOneAnnouncementQuery,
                    variables: { id: 99999 },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'announcement not found',
            );
        });
    });

    describe('Update Announcement', () => {
        beforeEach(async () => {
            const announcementRepository =
                dataSource.getRepository(Announcement);
            const categories = createdCategoryIds.map(
                (id) => ({ id }) as Category,
            );

            const announcement = await announcementRepository.save({
                title: 'Original Title',
                content: 'Original content',
                publishedAt: new Date(),
                categories,
            });

            createdAnnouncementId = announcement.id;
        });

        it('should update an announcement', async () => {
            const updateAnnouncementMutation = print(gql`
                mutation UpdateAnnouncement($input: UpdateAnnouncementInput!) {
                    updateAnnouncement(input: $input) {
                        id
                        title
                        content
                        updatedAt
                        categories {
                            id
                        }
                    }
                }
            `);

            const input = {
                id: createdAnnouncementId,
                title: 'Updated Title',
                content: 'Updated content',
                categoryIds: [createdCategoryIds[0]],
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: updateAnnouncementMutation,
                    variables: { input },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.updateAnnouncement.id).toBe(
                createdAnnouncementId,
            );
            expect(response.body.data.updateAnnouncement.title).toBe(
                'Updated Title',
            );
            expect(response.body.data.updateAnnouncement.content).toBe(
                'Updated content',
            );
            expect(
                response.body.data.updateAnnouncement.categories,
            ).toHaveLength(1);
        });

        it('should update announcement without changing categories', async () => {
            const updateAnnouncementMutation = print(gql`
                mutation UpdateAnnouncement($input: UpdateAnnouncementInput!) {
                    updateAnnouncement(input: $input) {
                        id
                        title
                        categories {
                            id
                        }
                    }
                }
            `);

            const input = {
                id: createdAnnouncementId,
                title: 'Updated Title Only',
                categoryIds: [],
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: updateAnnouncementMutation,
                    variables: { input },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.updateAnnouncement.title).toBe(
                'Updated Title Only',
            );
            expect(
                response.body.data.updateAnnouncement.categories,
            ).toHaveLength(2);
        });
    });

    describe('Delete Announcement', () => {
        beforeEach(async () => {
            const announcementRepository =
                dataSource.getRepository(Announcement);

            const categories = createdCategoryIds.map((id) => {
                const category = new Category();

                category.id = id;

                return category;
            });

            const announcement = await announcementRepository.save({
                title: 'To Be Deleted',
                content: 'Delete me',
                publishedAt: new Date(),
                categories,
            });

            createdAnnouncementId = announcement.id;
        });

        it('should delete an announcement', async () => {
            const deleteAnnouncementMutation = print(gql`
                mutation DeleteAnnouncement($id: Int!) {
                    deleteAnnouncement(id: $id)
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: deleteAnnouncementMutation,
                    variables: { id: createdAnnouncementId },
                })
                .expect(200);

            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.deleteAnnouncement).toBe(true);

            const announcementRepository =
                dataSource.getRepository(Announcement);
            const deletedAnnouncement = await announcementRepository.findOne({
                where: { id: createdAnnouncementId },
            });
            expect(deletedAnnouncement).toBeNull();
        });

        it('should return error when trying to delete non-existent announcement', async () => {
            const deleteAnnouncementMutation = print(gql`
                mutation DeleteAnnouncement($id: Int!) {
                    deleteAnnouncement(id: $id)
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: deleteAnnouncementMutation,
                    variables: { id: 99999 },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'Announcement does not exist',
            );
        });
    });

    describe('Data Validation', () => {
        it('should validate required fields when creating announcement', async () => {
            const createAnnouncementMutation = print(gql`
                mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
                    createAnnouncement(input: $input) {
                        id
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: createAnnouncementMutation,
                    variables: {
                        input: {
                            categoryIds: [],
                        },
                    },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
        });

        it('should validate title length constraint', async () => {
            const createAnnouncementMutation = print(gql`
                mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
                    createAnnouncement(input: $input) {
                        id
                    }
                }
            `);

            const longTitle = 'a'.repeat(1001);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: createAnnouncementMutation,
                    variables: {
                        input: {
                            title: longTitle,
                            content: 'Valid content',
                            publishedAt: new Date().toISOString(),
                            categoryIds: [],
                        },
                    },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
        });
    });
});
