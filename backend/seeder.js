import { initialData } from './seedData.js';
import { models } from './models/index.js';

export const seedDatabase = async () => {
  try {
    const forceSeed = process.env.FORCE_SEED === 'true';

    for (const key of Object.keys(models)) {
      const Model = models[key];
      if (!Model) continue;

      if (forceSeed) {
        await Model.deleteMany({});
        console.log(`[MongoDB Seeder] Force cleared '${key}' collection.`);
      }

      const count = await Model.countDocuments();
      if (count === 0 && initialData[key] && initialData[key].length > 0) {
        await Model.insertMany(initialData[key]);
        console.log(`[MongoDB Seeder] Seeded ${initialData[key].length} initial records into '${key}' collection.`);
      }
    }

    console.log('[MongoDB Seeder] Database check completed. All user data is preserved permanently.');
  } catch (err) {
    console.error('[MongoDB Seeder Error] Failed to check or seed database:', err.message);
  }
};

