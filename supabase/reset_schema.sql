-- Полный сброс схемы: удаление таблиц и пересоздание
-- Запускать в SQL Editor в Supabase

-- Удаление таблиц в правильном порядке (с учетом foreign keys)
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS habit_entries CASCADE;
DROP TABLE IF EXISTS habits CASCADE;

-- Пересоздание таблиц
-- Таблица привычек
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Таблица записей о выполнении привычек
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'partial', 'missed')),
  note TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS habit_entries_habit_date ON habit_entries (habit_id, date);

-- Таблица напоминаний
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  time TEXT NOT NULL DEFAULT '09:00',
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,0]
);

CREATE UNIQUE INDEX IF NOT EXISTS reminders_habit ON reminders (habit_id);

-- Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Grants for authenticated role
GRANT ALL ON TABLE habits TO authenticated;
GRANT ALL ON TABLE habit_entries TO authenticated;
GRANT ALL ON TABLE reminders TO authenticated;

-- Policies for habits
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can create own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for habit_entries
DROP POLICY IF EXISTS "Users can view own entries" ON habit_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON habit_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON habit_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON habit_entries;

CREATE POLICY "Users can view own entries" ON habit_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries" ON habit_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON habit_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON habit_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can create own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ── Phase 2: Trainer Content Platform ──

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialization TEXT,
  photo_url TEXT,
  is_trainer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE trainer_profiles TO authenticated;
GRANT ALL ON TABLE workouts TO authenticated;

-- trainer_profiles policies
DROP POLICY IF EXISTS "Anyone can view trainer profiles" ON trainer_profiles;
DROP POLICY IF EXISTS "Users can create own trainer profile" ON trainer_profiles;
DROP POLICY IF EXISTS "Users can update own trainer profile" ON trainer_profiles;

CREATE POLICY "Anyone can view trainer profiles" ON trainer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create own trainer profile" ON trainer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trainer profile" ON trainer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- workouts policies
DROP POLICY IF EXISTS "Users can view published workouts" ON workouts;
DROP POLICY IF EXISTS "Trainer can create workouts" ON workouts;
DROP POLICY IF EXISTS "Trainer can update workouts" ON workouts;
DROP POLICY IF EXISTS "Trainer can delete workouts" ON workouts;

CREATE POLICY "Users can view published workouts" ON workouts
  FOR SELECT USING (is_published = true OR auth.uid() = trainer_id);

CREATE POLICY "Trainer can create workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainer can update workouts" ON workouts
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainer can delete workouts" ON workouts
  FOR DELETE USING (auth.uid() = trainer_id);