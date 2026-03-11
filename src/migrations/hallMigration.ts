import mongoose from 'mongoose';
import { Hall } from '../models/hall';

/**
 * One-time migration for Hall collection:
 * 1. Drop the old `name_1` unique index (global uniqueness) if it exists.
 *    The new compound index `(name, wing)` allows the same name in both wings.
 * 2. Remove legacy Hall documents that have no `wing` field — they are
 *    ambiguous and the admin must re-add them per wing.
 */
export async function migrateHalls(): Promise<void> {
  try {
    const collection = mongoose.connection.collection('halls');

    // Drop old global-unique name index if it still exists
    const indexes = await collection.indexes();
    const oldIndex = indexes.find(
      (idx) => idx.name === 'name_1' && idx.key && Object.keys(idx.key).length === 1 && idx.key.name === 1
    );
    if (oldIndex) {
      await collection.dropIndex('name_1');
      console.log('[Migration] Dropped old Hall index: name_1');
    }

    // Remove Hall documents without a wing field (legacy data)
    const result = await Hall.deleteMany({ wing: { $exists: false } } as any);
    if (result.deletedCount > 0) {
      console.log(`[Migration] Removed ${result.deletedCount} legacy Hall document(s) without a wing. Please re-add halls per wing in Settings.`);
    }
  } catch (err) {
    console.error('[Migration] Hall migration error:', err);
  }
}
