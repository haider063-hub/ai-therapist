import { pgDb } from "../db.pg";
import { ArchiveSchema, ArchiveItemSchema } from "../schema.pg";
import { eq, and, count } from "drizzle-orm";
import type {
  Archive,
  ArchiveItem,
  ArchiveWithItemCount,
} from "app-types/archive";

export const pgArchiveRepository = {
  async createArchive(
    archive: Omit<Archive, "id" | "createdAt" | "updatedAt">,
  ): Promise<Archive> {
    const [newArchive] = await pgDb
      .insert(ArchiveSchema)
      .values({
        id: crypto.randomUUID(),
        ...archive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newArchive;
  },

  async getArchivesByUserId(userId: string): Promise<ArchiveWithItemCount[]> {
    const archives = await pgDb
      .select({
        id: ArchiveSchema.id,
        userId: ArchiveSchema.userId,
        name: ArchiveSchema.name,
        description: ArchiveSchema.description,
        createdAt: ArchiveSchema.createdAt,
        updatedAt: ArchiveSchema.updatedAt,
        itemCount: count(ArchiveItemSchema.id),
      })
      .from(ArchiveSchema)
      .leftJoin(
        ArchiveItemSchema,
        eq(ArchiveSchema.id, ArchiveItemSchema.archiveId),
      )
      .where(eq(ArchiveSchema.userId, userId))
      .groupBy(ArchiveSchema.id);

    return archives;
  },

  async getArchiveById(id: string): Promise<Archive | null> {
    const [archive] = await pgDb
      .select()
      .from(ArchiveSchema)
      .where(eq(ArchiveSchema.id, id));

    return archive || null;
  },

  async updateArchive(
    id: string,
    archive: Partial<Omit<Archive, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Archive> {
    const [updatedArchive] = await pgDb
      .update(ArchiveSchema)
      .set({
        ...archive,
        updatedAt: new Date(),
      })
      .where(eq(ArchiveSchema.id, id))
      .returning();

    return updatedArchive;
  },

  async deleteArchive(id: string): Promise<void> {
    await pgDb.delete(ArchiveSchema).where(eq(ArchiveSchema.id, id));
  },

  async addItemToArchive(
    archiveId: string,
    itemId: string,
    userId: string,
  ): Promise<ArchiveItem> {
    const [item] = await pgDb
      .insert(ArchiveItemSchema)
      .values({
        id: crypto.randomUUID(),
        archiveId,
        threadId: itemId,
        itemId,
        userId,
        addedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return item;
  },

  async removeItemFromArchive(
    archiveId: string,
    itemId: string,
  ): Promise<void> {
    await pgDb
      .delete(ArchiveItemSchema)
      .where(
        and(
          eq(ArchiveItemSchema.archiveId, archiveId),
          eq(ArchiveItemSchema.itemId, itemId),
        ),
      );
  },

  async getArchiveItems(archiveId: string): Promise<ArchiveItem[]> {
    return await pgDb
      .select()
      .from(ArchiveItemSchema)
      .where(eq(ArchiveItemSchema.archiveId, archiveId));
  },

  async getItemArchives(itemId: string, userId: string): Promise<Archive[]> {
    return await pgDb
      .select({
        id: ArchiveSchema.id,
        userId: ArchiveSchema.userId,
        name: ArchiveSchema.name,
        description: ArchiveSchema.description,
        createdAt: ArchiveSchema.createdAt,
        updatedAt: ArchiveSchema.updatedAt,
      })
      .from(ArchiveSchema)
      .innerJoin(
        ArchiveItemSchema,
        eq(ArchiveSchema.id, ArchiveItemSchema.archiveId),
      )
      .where(
        and(
          eq(ArchiveItemSchema.itemId, itemId),
          eq(ArchiveSchema.userId, userId),
        ),
      );
  },
};
