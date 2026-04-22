import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const novels = sqliteTable("novels", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const volumes = sqliteTable("volumes", {
  id: text("id").primaryKey(),
  novelId: text("novel_id").references(() => novels.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  volumeId: text("volume_id").references(() => volumes.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Relations
export const novelsRelations = relations(novels, ({ many }) => ({
  volumes: many(volumes),
}));

export const volumesRelations = relations(volumes, ({ one, many }) => ({
  novel: one(novels, {
    fields: [volumes.novelId],
    references: [novels.id],
  }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  volume: one(volumes, {
    fields: [chapters.volumeId],
    references: [volumes.id],
  }),
}));
