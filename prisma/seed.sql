INSERT INTO "User" ("id", "clerkId", "email", "systemRole", "createdAt", "updatedAt")
VALUES (
  'cuid_system_admin',
  'user_2wCBETc5XIIgyIXWsOqVu3cUyvu',
  'daiki.yoshioka@nexanahq.com',
  'system_team',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET "systemRole" = 'system_team'; 