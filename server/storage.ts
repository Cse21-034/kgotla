import {
  users,
  posts,
  comments,
  votes,
  bookmarks,
  notifications,
  groups,
  groupMembers,
  type User,
  type UpsertUser,
  type InsertPost,
  type Post,
  type InsertComment,
  type Comment,
  type InsertVote,
  type Vote,
  type InsertBookmark,
  type Bookmark,
  type InsertNotification,
  type Notification,
  type InsertGroup,
  type Group,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Post operations
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<void>;

  // Comment operations
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;

  // Vote operations
  getVote(userId: string, postId?: number, commentId?: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, type: string): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Bookmark operations
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: string, postId: number): Promise<void>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Group operations
  getGroups(): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  leaveGroup(groupId: number, userId: string): Promise<void>;

  // Search operations
  searchPosts(query: string, limit?: number): Promise<Post[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Comment operations
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update post comment count
    if (comment.postId) {
      await db
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, comment.postId));
    }
    
    return newComment;
  }

  async updateComment(id: number, updates: Partial<Comment>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db.delete(comments).where(eq(comments.id, id));
      
      // Update post comment count
      if (comment.postId) {
        await db
          .update(posts)
          .set({ commentCount: sql`${posts.commentCount} - 1` })
          .where(eq(posts.id, comment.postId));
      }
    }
  }

  // Vote operations
  async getVote(userId: string, postId?: number, commentId?: number): Promise<Vote | undefined> {
    const conditions = [eq(votes.userId, userId)];
    
    if (postId) {
      conditions.push(eq(votes.postId, postId));
    }
    
    if (commentId) {
      conditions.push(eq(votes.commentId, commentId));
    }
    
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(...conditions));
    
    return vote;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    
    // Update vote counts
    if (vote.postId) {
      const field = vote.type === "upvote" ? "upvotes" : "downvotes";
      await db
        .update(posts)
        .set({ [field]: sql`${field} + 1` })
        .where(eq(posts.id, vote.postId));
    }
    
    if (vote.commentId) {
      const field = vote.type === "upvote" ? "upvotes" : "downvotes";
      await db
        .update(comments)
        .set({ [field]: sql`${field} + 1` })
        .where(eq(comments.id, vote.commentId));
    }
    
    return newVote;
  }

  async updateVote(id: number, type: string): Promise<Vote> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    
    if (vote) {
      // Update vote counts based on old and new type
      if (vote.postId) {
        const oldField = vote.type === "upvote" ? "upvotes" : "downvotes";
        const newField = type === "upvote" ? "upvotes" : "downvotes";
        
        await db
          .update(posts)
          .set({ 
            [oldField]: sql`${oldField} - 1`,
            [newField]: sql`${newField} + 1`
          })
          .where(eq(posts.id, vote.postId));
      }
      
      if (vote.commentId) {
        const oldField = vote.type === "upvote" ? "upvotes" : "downvotes";
        const newField = type === "upvote" ? "upvotes" : "downvotes";
        
        await db
          .update(comments)
          .set({ 
            [oldField]: sql`${oldField} - 1`,
            [newField]: sql`${newField} + 1`
          })
          .where(eq(comments.id, vote.commentId));
      }
    }
    
    const [updatedVote] = await db
      .update(votes)
      .set({ type })
      .where(eq(votes.id, id))
      .returning();
    
    return updatedVote;
  }

  async deleteVote(id: number): Promise<void> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    
    if (vote) {
      await db.delete(votes).where(eq(votes.id, id));
      
      // Update vote counts
      if (vote.postId) {
        const field = vote.type === "upvote" ? "upvotes" : "downvotes";
        await db
          .update(posts)
          .set({ [field]: sql`${field} - 1` })
          .where(eq(posts.id, vote.postId));
      }
      
      if (vote.commentId) {
        const field = vote.type === "upvote" ? "upvotes" : "downvotes";
        await db
          .update(comments)
          .set({ [field]: sql`${field} - 1` })
          .where(eq(comments.id, vote.commentId));
      }
    }
  }

  // Bookmark operations
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteBookmark(userId: string, postId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .orderBy(desc(groups.createdAt));
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async joinGroup(groupId: number, userId: string): Promise<void> {
    await db.insert(groupMembers).values({ groupId, userId });
    
    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`member_count + 1` })
      .where(eq(groups.id, groupId));
  }

  async leaveGroup(groupId: number, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`member_count - 1` })
      .where(eq(groups.id, groupId));
  }

  // Search operations
  async searchPosts(query: string, limit = 20): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(
        or(
          sql`${posts.title} ILIKE ${`%${query}%`}`,
          sql`${posts.content} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
