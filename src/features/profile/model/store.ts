import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { UserProfile } from '../../habits/model/types';

interface ProfileStoreState {
  profile: UserProfile | null;
  loadError: string | null;
  loadProfile: (userId: string) => Promise<void>;
  upsertProfile: (data: {
    userId: string;
    firstName: string;
    lastName?: string;
    aboutMe?: string;
    biggestGoal?: string;
  }) => Promise<void>;
  clearProfile: () => void;
  exportProfile: () => UserProfile | null;
}

const id = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useProfileStore = create<ProfileStoreState>()((set, get) => ({
  profile: null,
  loadError: null,

  loadProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, first_name, last_name, about_me, biggest_goal, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      set({ loadError: `Ошибка загрузки профиля: ${error.message}` });
      return;
    }

    if (!data) {
      set({ profile: null });
      return;
    }

    const row = data as Record<string, unknown>;
    set({
      profile: {
        id: row.id as string,
        userId: row.user_id as string,
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        aboutMe: row.about_me as string,
        biggestGoal: row.biggest_goal as string,
        createdAt: row.created_at as string,
      },
    });
  },

  upsertProfile: async (data) => {
    const { userId, firstName, lastName, aboutMe, biggestGoal } = data;
    const profileId = get().profile?.id;

    if (profileId) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName ?? '',
          about_me: aboutMe ?? '',
          biggest_goal: biggestGoal ?? '',
        })
        .eq('id', profileId)
        .eq('user_id', userId);

      if (error) {
        set({ loadError: `Ошибка сохранения профиля: ${error.message}` });
        return;
      }
    } else {
      const payload = {
        id: id(),
        user_id: userId,
        first_name: firstName,
        last_name: lastName ?? '',
        about_me: aboutMe ?? '',
        biggest_goal: biggestGoal ?? '',
      };
      const { error } = await supabase.from('user_profiles').insert(payload);
      if (error) {
        set({ loadError: `Ошибка создания профиля: ${error.message}` });
        return;
      }
      set({
        profile: {
          id: payload.id,
          userId,
          firstName,
          lastName: lastName ?? '',
          aboutMe: aboutMe ?? '',
          biggestGoal: biggestGoal ?? '',
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    set({
      profile: {
        id: profileId,
        userId,
        firstName,
        lastName: lastName ?? '',
        aboutMe: aboutMe ?? '',
        biggestGoal: biggestGoal ?? '',
        createdAt: get().profile?.createdAt ?? new Date().toISOString(),
      },
    });
  },

  clearProfile: () => set({ profile: null, loadError: null }),

  exportProfile: () => get().profile,
}));
