
-- Add foreign key constraint for user_credits.user_id to profiles.id
ALTER TABLE public.user_credits
ADD CONSTRAINT fk_user_credits_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for teams.owner_id to profiles.id  
ALTER TABLE public.teams
ADD CONSTRAINT fk_teams_profiles
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
