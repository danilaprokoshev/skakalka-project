-- Обнуление данных (структура сохраняется)
-- Запускать в SQL Editor в Supabase

TRUNCATE TABLE reminders, habit_entries, habits, workouts, trainer_profiles, user_profiles RESTART IDENTITY CASCADE;