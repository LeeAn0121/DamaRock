-- Add language column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text not null default 'auto';
