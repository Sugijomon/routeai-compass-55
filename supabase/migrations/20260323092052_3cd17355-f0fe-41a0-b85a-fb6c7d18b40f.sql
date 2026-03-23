
-- Stap 1: Voeg 'dpo' toe aan app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'dpo';
