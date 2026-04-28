import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { TrainerProfile, Workout, WorkoutDifficulty } from './types';

interface WorkoutStoreState {
  trainerProfile: TrainerProfile | null;
  workouts: Workout[];
  publicWorkouts: Workout[];
  loadError: string | null;
  loadTrainerProfile: (userId: string) => Promise<void>;
  upsertTrainerProfile: (data: Partial<TrainerProfile> & { userId: string; displayName: string }) => Promise<void>;
  loadWorkouts: (userId: string) => Promise<void>;
  loadPublicWorkouts: () => Promise<void>;
  createWorkout: (data: {
    trainerId: string;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationMinutes?: number;
    difficulty?: WorkoutDifficulty;
    isPublished?: boolean;
  }) => Promise<void>;
  updateWorkout: (workoutId: string, data: Partial<{
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    durationMinutes: number;
    difficulty: WorkoutDifficulty;
    isPublished: boolean;
  }>) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  toggleWorkoutPublished: (workoutId: string) => Promise<void>;
  clearWorkouts: () => void;
}

const id = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useWorkoutStore = create<WorkoutStoreState>()((set, get) => ({
  trainerProfile: null,
  workouts: [],
  publicWorkouts: [],
  loadError: null,

  loadTrainerProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('trainer_profiles')
      .select('id, user_id, display_name, bio, specialization, photo_url, is_trainer, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      set({ loadError: `Ошибка загрузки профиля: ${error.message}` });
      return;
    }

    if (!data) {
      set({ trainerProfile: null });
      return;
    }

    const row = data as Record<string, unknown>;
    set({
      trainerProfile: {
        id: row.id as string,
        userId: row.user_id as string,
        displayName: row.display_name as string,
        bio: (row.bio as string) ?? undefined,
        specialization: (row.specialization as string) ?? undefined,
        photoUrl: (row.photo_url as string) ?? undefined,
        isTrainer: row.is_trainer as boolean,
        createdAt: row.created_at as string,
      },
    });
  },

  upsertTrainerProfile: async (data) => {
    const { userId, displayName, bio, specialization, photoUrl, isTrainer } = data;
    const profileId = get().trainerProfile?.id;

    const payload: Record<string, unknown> = {
      user_id: userId,
      display_name: displayName,
      bio: bio ?? null,
      specialization: specialization ?? null,
      photo_url: photoUrl ?? null,
      is_trainer: isTrainer ?? false,
    };

    if (profileId) {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({
          display_name: displayName,
          bio: bio ?? null,
          specialization: specialization ?? null,
          photo_url: photoUrl ?? null,
          is_trainer: isTrainer ?? false,
        })
        .eq('id', profileId)
        .eq('user_id', userId);

      if (error) {
        set({ loadError: `Ошибка сохранения профиля: ${error.message}` });
        return;
      }
    } else {
      payload.id = id();
      const { error } = await supabase.from('trainer_profiles').insert(payload);
      if (error) {
        set({ loadError: `Ошибка создания профиля: ${error.message}` });
        return;
      }
    }

    set({
      trainerProfile: {
        id: (profileId ?? payload.id) as string,
        userId,
        displayName,
        bio,
        specialization,
        photoUrl,
        isTrainer: (isTrainer ?? false) as boolean,
        createdAt: get().trainerProfile?.createdAt ?? new Date().toISOString(),
      },
    });
  },

  loadWorkouts: async (userId: string) => {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, trainer_id, title, description, video_url, thumbnail_url, duration_minutes, difficulty, created_at, is_published')
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ loadError: `Ошибка загрузки тренировок: ${error.message}` });
      return;
    }

    const workouts: Workout[] = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      trainerId: row.trainer_id as string,
      title: row.title as string,
      description: (row.description as string) ?? undefined,
      videoUrl: row.video_url as string,
      thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
      durationMinutes: row.duration_minutes as number | undefined,
      difficulty: (row.difficulty as WorkoutDifficulty) ?? undefined,
      createdAt: row.created_at as string,
      isPublished: row.is_published as boolean,
    }));

    set({ workouts });
  },

  createWorkout: async (data) => {
    const workoutId = id();
    const now = new Date().toISOString();

    const newWorkout: Workout = {
      id: workoutId,
      trainerId: data.trainerId,
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMinutes: data.durationMinutes,
      difficulty: data.difficulty,
      createdAt: now,
      isPublished: data.isPublished ?? true,
    };

    set((state) => ({ workouts: [newWorkout, ...state.workouts] }));

    const { error } = await supabase.from('workouts').insert({
      id: workoutId,
      trainer_id: data.trainerId,
      title: data.title,
      description: data.description ?? null,
      video_url: data.videoUrl,
      thumbnail_url: data.thumbnailUrl ?? null,
      duration_minutes: data.durationMinutes ?? null,
      difficulty: data.difficulty ?? null,
      is_published: data.isPublished ?? true,
    });

    if (error) {
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== workoutId),
        loadError: error.message,
      }));
    }
  },

  updateWorkout: async (workoutId, data) => {
    const previous = get().workouts.find((w) => w.id === workoutId);

    set((state) => ({
      workouts: state.workouts.map((w) =>
        w.id === workoutId ? { ...w, ...data } : w,
      ),
    }));

    const { error } = await supabase
      .from('workouts')
      .update({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.videoUrl !== undefined && { video_url: data.videoUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnail_url: data.thumbnailUrl }),
        ...(data.durationMinutes !== undefined && { duration_minutes: data.durationMinutes }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.isPublished !== undefined && { is_published: data.isPublished }),
      })
      .eq('id', workoutId);

    if (error && previous) {
      set((state) => ({
        workouts: state.workouts.map((w) =>
          w.id === workoutId ? previous : w,
        ),
        loadError: error.message,
      }));
    }
  },

  deleteWorkout: async (workoutId) => {
    const previous = get().workouts.find((w) => w.id === workoutId);

    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== workoutId),
    }));

    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
    if (error && previous) {
      set((state) => ({
        workouts: [previous, ...state.workouts],
        loadError: error.message,
      }));
    }
  },

  toggleWorkoutPublished: async (workoutId) => {
    const workout = get().workouts.find((w) => w.id === workoutId);
    if (!workout) return;

    const newValue = !workout.isPublished;
    set((state) => ({
      workouts: state.workouts.map((w) =>
        w.id === workoutId ? { ...w, isPublished: newValue } : w,
      ),
    }));

    const { error } = await supabase
      .from('workouts')
      .update({ is_published: newValue })
      .eq('id', workoutId);

    if (error) {
      set((state) => ({
        workouts: state.workouts.map((w) =>
          w.id === workoutId ? { ...w, isPublished: !newValue } : w,
        ),
      }));
    }
  },

  clearWorkouts: () => set({ trainerProfile: null, workouts: [], publicWorkouts: [], loadError: null }),

  loadPublicWorkouts: async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, trainer_id, title, description, video_url, thumbnail_url, duration_minutes, difficulty, created_at, is_published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      set({ loadError: `Ошибка загрузки тренировок: ${error.message}` });
      return;
    }

    const publicWorkouts: Workout[] = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      trainerId: row.trainer_id as string,
      title: row.title as string,
      description: (row.description as string) ?? undefined,
      videoUrl: row.video_url as string,
      thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
      durationMinutes: row.duration_minutes as number | undefined,
      difficulty: (row.difficulty as WorkoutDifficulty) ?? undefined,
      createdAt: row.created_at as string,
      isPublished: row.is_published as boolean,
    }));

    set({ publicWorkouts });
  },
}));
