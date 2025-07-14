import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  reputation: integer("reputation").default(0),
  isVerified: boolean("is_verified").default(false),
  verificationBadge: varchar("verification_badge"), // "elder", "mentor", "expert"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups/Tribes table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  location: varchar("location"),
  category: varchar("category"), // "location", "interest", "cultural"
  memberCount: integer("member_count").default(0),
  creatorId: varchar("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group memberships
export const groupMembers = pgTable("group_members", {
  groupId: integer("group_id").references(() => groups.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role").default("member"), // "admin", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.userId] }),
}));

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  type: varchar("type").notNull(), // "text", "image", "poll", "question", "link"
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  pollOptions: jsonb("poll_options"), // Array of poll options with vote counts
  tags: jsonb("tags"), // Array of tag strings
  isAnonymous: boolean("is_anonymous").default(false),
  allowComments: boolean("allow_comments").default(true),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  authorId: varchar("author_id").references(() => users.id),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  commentId: integer("comment_id").references(() => comments.id),
  type: varchar("type").notNull(), // "upvote", "downvote"
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPostUnique: index("user_post_unique").on(table.userId, table.postId),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // "comment", "vote", "mention", "follow"
  title: varchar("title", { length: 200 }),
  content: text("content"),
  relatedPostId: integer("related_post_id").references(() => posts.id),
  relatedCommentId: integer("related_comment_id").references(() => comments.id),
  relatedUserId: varchar("related_user_id").references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  groupMemberships: many(groupMembers),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
  comments: many(comments),
  votes: many(votes),
  bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  votes: many(votes),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  members: many(groupMembers),
  posts: many(posts),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
