/* eslint @typescript-eslint/no-unsafe-member-access: 0 */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../models';
import { CategoriesModule } from '../categories.module';
import { appSetup } from '../../../utils';
import { setupDataSource } from '../../../../tests/setupDataSource';
import { gql } from 'graphql-tag';
import { print } from 'graphql';

describe('Categories (e2e)', () => {
    let app: INestApplication;
    let categoryRepository: Repository<Category>;

    beforeAll(async () => {
        const dataSource = await setupDataSource();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    entities: [Category],
                    synchronize: true,
                }),
                CategoriesModule,
            ],
        })
            .overrideProvider(DataSource)
            .useValue(dataSource)
            .compile();

        app = moduleFixture.createNestApplication({
            logger: false,
        });
        categoryRepository = moduleFixture.get(getRepositoryToken(Category));

        appSetup(app);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await categoryRepository.query(`
            TRUNCATE category CASCADE;
            TRUNCATE announcement CASCADE;
            TRUNCATE announcement_to_category CASCADE;
        `);
    });

    describe('categories query', () => {
        it('should return empty array when no categories exist', async () => {
            const query = print(gql`
                query {
                    categories {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200);

            expect(response.body.data.categories).toEqual([]);
        });

        it('should return all categories', async () => {
            const category1 = categoryRepository.create({ name: 'Technology' });
            const category2 = categoryRepository.create({ name: 'Sports' });
            await categoryRepository.save([category1, category2]);

            const query = print(gql`
                query {
                    categories {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200);

            expect(response.body.data.categories).toHaveLength(2);
            expect(response.body.data.categories).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Technology',
                        id: expect.any(Number),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    }),
                    expect.objectContaining({
                        name: 'Sports',
                        id: expect.any(Number),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    }),
                ]),
            );
        });
    });

    describe('createCategory mutation', () => {
        it('should create a new category', async () => {
            const mutation = print(gql`
                mutation CreateCategory($input: CreateCategoryInput!) {
                    createCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    name: 'Entertainment',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.data.createCategory).toEqual({
                id: expect.any(Number),
                name: 'Entertainment',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });

            const savedCategory = await categoryRepository.findOne({
                where: { name: 'Entertainment' },
            });
            expect(savedCategory).toBeDefined();
            expect(savedCategory?.name).toBe('Entertainment');
        });

        it('should fail when creating category with duplicate name', async () => {
            const existingCategory = categoryRepository.create({
                name: 'Duplicate',
            });
            await categoryRepository.save(existingCategory);

            const mutation = print(gql`
                mutation CreateCategory($input: CreateCategoryInput!) {
                    createCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    name: 'Duplicate',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'Mutation createCategory failed',
            );
        });

        it('should fail when creating category with invalid input', async () => {
            const mutation = print(gql`
                mutation CreateCategory($input: CreateCategoryInput!) {
                    createCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    name: '',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('updateCategory mutation', () => {
        it('should update an existing category', async () => {
            const category = categoryRepository.create({ name: 'Old Name' });
            const savedCategory = await categoryRepository.save(category);

            const mutation = print(gql`
                mutation UpdateCategory($input: UpdateCategoryInput!) {
                    updateCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    id: savedCategory.id,
                    name: 'Updated Name',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.data.updateCategory).toEqual({
                id: savedCategory.id,
                name: 'Updated Name',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });

            const updatedCategory = await categoryRepository.findOne({
                where: { id: savedCategory.id },
            });
            expect(updatedCategory?.name).toBe('Updated Name');
            expect(updatedCategory?.updatedAt.getTime()).toBeGreaterThan(
                updatedCategory?.createdAt.getTime() as number,
            );
        });

        it('should fail when updating non-existent category', async () => {
            const mutation = print(gql`
                mutation UpdateCategory($input: UpdateCategoryInput!) {
                    updateCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    id: 99999,
                    name: 'Updated Name',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.errors).toBeDefined();
        });

        it('should fail when updating to duplicate name', async () => {
            const category1 = categoryRepository.create({ name: 'Category 1' });
            const category2 = categoryRepository.create({ name: 'Category 2' });
            const [saved1] = await categoryRepository.save([
                category1,
                category2,
            ]);

            const mutation = print(gql`
                mutation UpdateCategory($input: UpdateCategoryInput!) {
                    updateCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const variables = {
                input: {
                    id: saved1.id,
                    name: 'Category 2',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'Mutation updateCategory failed',
            );
        });
    });

    describe('deleteCategory mutation', () => {
        it('should delete an existing category', async () => {
            const category = categoryRepository.create({ name: 'To Delete' });
            const savedCategory = await categoryRepository.save(category);

            const mutation = print(gql`
                mutation DeleteCategory($id: Int!) {
                    deleteCategory(id: $id)
                }
            `);

            const variables = {
                id: savedCategory.id,
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.data.deleteCategory).toBe(true);

            const deletedCategory = await categoryRepository.findOne({
                where: { id: savedCategory.id },
            });
            expect(deletedCategory).toBeNull();
        });

        it('should throw error when deleting non-existent category', async () => {
            const mutation = print(gql`
                mutation DeleteCategory($id: Int!) {
                    deleteCategory(id: $id)
                }
            `);

            const variables = {
                id: 99999,
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: mutation, variables })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain(
                'Category does not exist',
            );
        });
    });

    describe('integration tests', () => {
        it('should perform complete CRUD operations', async () => {
            const createMutation = print(gql`
                mutation CreateCategory($input: CreateCategoryInput!) {
                    createCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const createResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: createMutation,
                    variables: { input: { name: 'CRUD Test' } },
                })
                .expect(200);

            const createdId = createResponse.body.data.createCategory
                .id as number;

            const readQuery = print(gql`
                query {
                    categories {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const readResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: readQuery })
                .expect(200);

            expect(readResponse.body.data.categories).toHaveLength(1);
            expect(readResponse.body.data.categories[0].name).toBe('CRUD Test');

            const updateMutation = print(gql`
                mutation UpdateCategory($input: UpdateCategoryInput!) {
                    updateCategory(input: $input) {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            `);

            const updateResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: updateMutation,
                    variables: {
                        input: { id: createdId, name: 'CRUD Test Updated' },
                    },
                })
                .expect(200);

            expect(updateResponse.body.data.updateCategory.name).toBe(
                'CRUD Test Updated',
            );

            const deleteMutation = print(gql`
                mutation DeleteCategory($id: Int!) {
                    deleteCategory(id: $id)
                }
            `);

            const deleteResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: deleteMutation,
                    variables: { id: createdId },
                })
                .expect(200);

            expect(deleteResponse.body.data.deleteCategory).toBe(true);

            const finalReadResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: readQuery })
                .expect(200);

            expect(finalReadResponse.body.data.categories).toHaveLength(0);
        });
    });
});
