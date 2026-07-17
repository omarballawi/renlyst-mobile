import type { SQLiteDatabase } from 'expo-sqlite';

import {
  drugBackupSchema,
  drugRelationshipBackupSchema,
  type DrugBackup,
  type DrugRelationshipBackup,
} from '@/domain/backup';

export type DrugRelationshipItem = {
  relationship: DrugRelationshipBackup;
  otherProfile: DrugBackup | null;
};

type RelationshipRow = {
  relationship_json: string;
  other_profile_json: string | null;
};

export class RelationshipRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listForDrug(drugID: string): Promise<DrugRelationshipItem[]> {
    const rows = await this.db.getAllAsync<RelationshipRow>(
      `SELECT
         relationship.payload_json AS relationship_json,
         other.payload_json AS other_profile_json
       FROM drug_relationships relationship
       LEFT JOIN drug_profiles other
         ON other.id = CASE
           WHEN relationship.source_drug_id = $drugID THEN relationship.target_drug_id
           ELSE relationship.source_drug_id
         END
       WHERE relationship.source_drug_id = $drugID OR relationship.target_drug_id = $drugID
       ORDER BY relationship.checked_at DESC, relationship.kind_raw COLLATE NOCASE`,
      { $drugID: drugID },
    );
    return rows.map((row) => ({
      relationship: drugRelationshipBackupSchema.parse(JSON.parse(row.relationship_json)),
      otherProfile: row.other_profile_json
        ? drugBackupSchema.parse(JSON.parse(row.other_profile_json))
        : null,
    }));
  }
}
