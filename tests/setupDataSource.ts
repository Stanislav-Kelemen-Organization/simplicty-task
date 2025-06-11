import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { join } from 'path';

export const setupDataSource = async () => {
    const db = newDb({
        autoCreateForeignKeyIndices: true,
    });

    db.public.registerFunction({
        implementation: () => 'test',
        name: 'current_database',
    });

    db.public.registerFunction({
        implementation: () => 'test',
        name: 'version',
    });

    const ds: DataSource = (await db.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [join(__dirname, '..', 'src', '**', '*.model.ts')],
    })) as DataSource;

    await ds.initialize();
    await ds.synchronize();

    return ds;
};
