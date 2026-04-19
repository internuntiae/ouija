-- 1. Clear existing data (Optional, useful for clean dev environments)
TRUNCATE TABLE "User", "Friendship", "Chat", "ChatUser", "Message", "Attachment", "Reaction" CASCADE;

-- 2. Insert Users
-- Note: In a real app, passwords would be hashed.
INSERT INTO "User" ("id", "email", "password", "nickname", "status", "updatedAt")
VALUES
    ('u1', 'alice@example.com', 'hashed_pwd_1', 'AliceInWonderland', 'ONLINE', NOW()),
    ('u2', 'bob@example.com', 'hashed_pwd_2', 'BuilderBob', 'OFFLINE', NOW()),
    ('u3', 'charlie@example.com', 'hashed_pwd_3', 'CharlieBrown', 'AWAY', NOW()),
    ('u4', 'dana@example.com', 'hashed_pwd_4', 'DanaScully', 'BUSY', NOW());

-- 3. Insert Friendships
INSERT INTO "Friendship" ("userId", "friendId", "status", "updatedAt")
VALUES
    ('u1', 'u2', 'ACCEPTED', NOW()), -- Alice and Bob are friends
    ('u1', 'u3', 'PENDING', NOW()),  -- Alice requested Charlie
    ('u2', 'u4', 'BLOCKED', NOW());  -- Bob blocked Dana

-- 4. Insert Chats (1 Private, 1 Group)
INSERT INTO "Chat" ("id", "name", "type", "updatedAt")
VALUES
    ('c1', NULL, 'PRIVATE', NOW()),
    ('c2', 'The Dream Team', 'GROUP', NOW());

-- 5. Add Users to Chats
INSERT INTO "ChatUser" ("chatId", "userId", "role")
VALUES
    ('c1', 'u1', 'MEMBER'), -- Private chat user 1
    ('c1', 'u2', 'MEMBER'), -- Private chat user 2
    ('c2', 'u1', 'ADMIN'),  -- Group Admin
    ('c2', 'u3', 'MEMBER'),
    ('c2', 'u4', 'MEMBER');

-- 6. Insert Messages
-- Using IDs 1, 2, 3... because of autoincrement
INSERT INTO "Message" ("id", "chatId", "senderId", "content", "sentAt")
VALUES
    (1, 'c1', 'u1', 'Hey Bob, did you see the update?', NOW()),
    (2, 'c1', 'u2', 'Just checking it out now!', NOW()),
    (3, 'c2', 'u1', 'Welcome to the group everyone!', NOW());

-- 7. Insert Attachments
INSERT INTO "Attachment" ("id", "messageId", "url", "type")
VALUES
    ('a1', 1, 'https://example.com/screenshot.png', 'IMAGE'),
    ('a2', 3, 'https://example.com/rules.pdf', 'FILE');

-- 8. Insert Reactions
INSERT INTO "Reaction" ("messageId", "userId", "type")
VALUES
    (1, 'u2', 'THUMBS_UP'),
    (3, 'u3', 'LOVE'),
    (3, 'u4', 'LAUGH');