import hashlib
import sys
import random

def escape_sql(text):
    """
    Escapes single quotes for SQL and wraps the string in single quotes.
    This allows strings to safely contain ', ", `, and other symbols.
    """
    if text is None:
        return "NULL"
    # SQL Standard: Escape ' by doubling it to ''
    # ", `, and other symbols are treated as normal text inside ' '
    safe_text = str(text).replace("'", "''")
    return f"'{safe_text}'"

def generate_static_file(extra_count):
    prefixes = ["Alpha", "Beta", "Cyber", "Dark", "Echo", "Frost", "Giga", "Hyper", "Iron", "Jade",
                "Luna", "Mist", "Neon", "Onyx", "Pixel", "Quantum", "Rapid", "Solar", "Titan", "Vortex"]
    nouns = ["Wolf", "Knight", "Coder", "Ghost", "Falcon", "Blaze", "Eagle", "Nova", "Hunter", "Storm",
             "Rider", "Sage", "Panda", "Rex", "Viper", "Zion", "Orbit", "Pixel", "Dragon", "Shadow"]

    message_samples = [
        "Has anyone seen the documentation?", "I'll be OOO tomorrow.", "Check out this new feature!",
        "Can we hop on a quick call?", "LGTM!", "I love femboys!",
        "Deployment successful.", "Does anyone have the API keys?", "Working on the refactor now.",
        "Coffee break?", "ouija is the worst app i have ever seen :skull:", "Just pushed the latest changes."
    ]

    extra_count = min(extra_count, 1000)

    with open("insert.sql", "w") as f:
        f.write("-- 1. Clear existing data\n")
        f.write('TRUNCATE TABLE "User", "Friendship", "Chat", "ChatUser", "Message", "Attachment", "Reaction" CASCADE;\n\n')

        # 2. Users
        f.write("-- 2. Insert Users\n")
        f.write('INSERT INTO "User" ("id", "email", "password", "nickname", "status", "updatedAt") VALUES\n')

        users = []

        # Generate unique nicknames
        used_nicks = {"AliceInWonderland", "BuilderBob", "CharlieBrown", "DanaScully"}
        for i in range(1, extra_count+1):
            u_id = f'u{i}'
            # Loop to ensure uniqueness
            while True:
                nick = f"{random.choice(prefixes)}{random.choice(nouns)}{random.randint(10, 999)}"
                if nick not in used_nicks:
                    used_nicks.add(nick)
                    break

            email = f"{nick.lower()}@example.com"
            status = random.choice(['ONLINE', 'OFFLINE', 'AWAY', 'BUSY'])
            users.append((u_id, email, f'{hashlib.sha256(f"hashed_{i}".encode("utf-8")).hexdigest()}', nick, status))

        user_lines = [f"    ('{u[0]}', '{u[1]}', '{u[2]}', '{u[3]}', '{u[4]}', NOW())" for u in users]
        f.write(",\n".join(user_lines) + ";\n\n")

        # 3. Insert Friendships
        f.write("-- 3. Insert Friendships\n")
        f.write('INSERT INTO "Friendship" ("userId", "friendId", "status", "updatedAt") VALUES\n')

        # Use a set to track (min_id, max_id) to prevent (u1, u2) AND (u2, u1) duplicates
        seen_friendships = {('u1', 'u2'), ('u1', 'u3')}
        friendships = ["('u1', 'u2', 'ACCEPTED', NOW())", "('u1', 'u3', 'PENDING', NOW())"]

        user_ids = [u[0] for u in users]
        attempts = 0
        max_friendships = int(extra_count * 1.5)

        while len(friendships) < max_friendships and attempts < 5000:
            u1, u2 = random.sample(user_ids, 2)

            # Sort them so that ('u1', 'u2') and ('u2', 'u1') are treated as the same pair
            pair = tuple(sorted((u1, u2)))

            if pair not in seen_friendships:
                seen_friendships.add(pair)
                status = random.choice(['ACCEPTED', 'PENDING', 'BLOCKED'])
                friendships.append(f"('{u1}', '{u2}', '{status}', NOW())")
            attempts += 1

        f.write("    " + ",\n    ".join(friendships) + ";\n\n")

        # 4. Chats
        f.write("-- 4. Insert Chats\n")
        f.write('INSERT INTO "Chat" ("id", "name", "type", "updatedAt") VALUES\n')
        chats = [('c1', 'NULL', 'PRIVATE'), ('c2', "'The Dream Team'", 'GROUP')]
        num_chats = 2 + (extra_count // 5) # Create 1 chat for every 5 users
        for i in range(3, num_chats + 1):
            c_type = random.choice(['PRIVATE', 'GROUP'])
            c_name = f"'Channel {i}'" if c_type == 'GROUP' else 'NULL'
            chats.append((f'c{i}', c_name, c_type))
        chat_lines = [f"    ('{c[0]}', {c[1]}, '{c[2]}', NOW())" for c in chats]
        f.write(",\n".join(chat_lines) + ";\n\n")

        # 5. Chat Users
        f.write("-- 5. Add Users to Chats\n")
        f.write('INSERT INTO "ChatUser" ("chatId", "userId", "role") VALUES\n')
        chat_users = ["('c1', 'u1', 'MEMBER')", "('c1', 'u2', 'MEMBER')", "('c2', 'u1', 'ADMIN')"]

        # Ensure every user is in at least one chat
        for u_id in user_ids[4:]:
            c_id = f"c{random.randint(1, num_chats)}"
            chat_users.append(f"('{c_id}', '{u_id}', 'MEMBER')")
        f.write("    " + ",\n    ".join(chat_users) + ";\n\n")

        # 6. Messages
        f.write("-- 6. Insert Messages\n")
        f.write('INSERT INTO "Message" ("id", "chatId", "senderId", "content", "sentAt") VALUES\n')
        msg_list = ["(1, 'c1', 'u1', 'Hey Bob, did you see the update?', NOW())"]

        # Scale messages based on user count
        for i in range(2, extra_count * 3):
            c_id = f"c{random.randint(1, num_chats)}"
            u_id = random.choice(user_ids)
            txt = random.choice(message_samples)
            msg_list.append(f"({i}, '{c_id}', '{u_id}', {escape_sql(txt)}, NOW())")
        f.write("    " + ",\n    ".join(msg_list) + ";\n")

    print(f"File 'insert.sql' generated with {len(users)} users and scaled activity.")

if __name__ == "__main__":
    count = 1000 # Default
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    generate_static_file(count)