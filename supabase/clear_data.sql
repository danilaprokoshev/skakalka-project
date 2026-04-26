-- Обнуление данных (структура сохраняется)
-- Запускать в SQL Editor в Supabase

TRUNCATE TABLE reminders, habit_entries, habits RESTART IDENTITY CASCADE;