import dataSource from '../datasource';
import datasource from '../datasource';

async function seed() {
    try {
        await dataSource.initialize();

        await datasource.query(`
            -- Step 1: Insert categories
            WITH inserted_categories AS ( INSERT INTO category (name) VALUES ('City'),
                                                                         ('Community events'),
                                                                         ('Crime & Safety'),
                                                                         ('Culture'),
                                                                         ('Discounts & Benefits'),
                                                                         ('Emergencies'),
                                                                         ('For Seniors'),
                                                                         ('Health'),
                                                                         ('Kids & Family') RETURNING id, name ),
             -- Step 2: Insert announcements and get their IDs
             inserted_announcements
                 AS ( INSERT INTO announcement (title, content, published_at) VALUES ('Downtown Road Closures',
                                                                                      'Several streets will be closed due to the marathon this weekend. Plan alternate routes.',
                                                                                      '2023-08-11T04:38:00Z'),
                                                                                     ('Community Picnic on Saturday',
                                                                                      'Join us at Central Park for food, music, and games for all ages starting at noon.',
                                                                                      '2023-08-10T14:12:00Z'),
                                                                                     ('New Art Exhibit Opening',
                                                                                      'Local artists showcase their work at the Modern Gallery. Exhibit runs all month.',
                                                                                      '2023-07-22T11:00:00Z'),
                                                                                     ('Emergency Services Drill',
                                                                                      'Emergency responders will conduct a preparedness drill near the city center tomorrow.',
                                                                                      '2023-06-19T09:45:00Z'),
                                                                                     ('Senior Health Checkup Program',
                                                                                      'Free health checkups for seniors available at city clinics this week only.',
                                                                                      '2023-05-15T10:00:00Z'),
                                                                                     ('Children’s Reading Festival',
                                                                                      'Bring your kids to the main library for fun book-themed activities and story time.',
                                                                                      '2023-04-18T16:20:00Z'),
                                                                                     ('Stay Safe This Summer',
                                                                                      'Tips from the fire department to avoid heat-related illnesses and stay hydrated.',
                                                                                      '2023-07-05T08:30:00Z'),
                                                                                     ('Discount Transit Passes',
                                                                                      'Eligible residents can apply online for discounted public transportation passes.',
                                                                                      '2023-06-30T12:00:00Z'),
                                                                                     ('Crime Watch Meeting',
                                                                                      'Residents are invited to discuss recent incidents and safety strategies.',
                                                                                      '2023-03-29T18:45:00Z'),
                                                                                     ('Cultural Parade Announced',
                                                                                      'The city will host its annual cultural celebration downtown next Sunday.',
                                                                                      '2023-08-01T13:00:00Z') RETURNING id, title ),
             -- Step 3: Insert into join table by matching titles and category names
             category_mapping AS ( SELECT a.id AS announcement_id, c.id AS category_id
                                   FROM inserted_announcements a
                                            JOIN inserted_categories c
                                                 ON ((a.title = 'Downtown Road Closures' AND c.name IN ('City')) OR
                                                     (a.title = 'Community Picnic on Saturday' AND
                                                      c.name IN ('City', 'Community events')) OR
                                                     (a.title = 'New Art Exhibit Opening' AND c.name IN ('City', 'Culture')) OR
                                                     (a.title = 'Emergency Services Drill' AND
                                                      c.name IN ('City', 'Emergencies')) OR
                                                     (a.title = 'Senior Health Checkup Program' AND
                                                      c.name IN ('City', 'For Seniors', 'Health')) OR
                                                     (a.title = 'Children’s Reading Festival' AND
                                                      c.name IN ('City', 'Kids & Family')) OR
                                                     (a.title = 'Stay Safe This Summer' AND c.name IN ('City', 'Emergencies')) OR
                                                     (a.title = 'Discount Transit Passes' AND
                                                      c.name IN ('City', 'Discounts & Benefits')) OR
                                                     (a.title = 'Crime Watch Meeting' AND c.name IN ('City', 'Crime & Safety')) OR
                                                     (a.title = 'Cultural Parade Announced' AND
                                                      c.name IN ('City', 'Culture', 'Community events'))) )
            
            -- Final insert
            INSERT
            INTO announcement_to_category (announcement_id, category_id)
            SELECT announcement_id, category_id
            FROM category_mapping;
        `);

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error(error);
        console.error('Seeding failed');
    } finally {
        process.exit();
    }
}

seed();
