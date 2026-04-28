export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TrainerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  specialization?: string;
  photoUrl?: string;
  isTrainer: boolean;
  createdAt: string;
}

export interface Workout {
  id: string;
  trainerId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  difficulty?: WorkoutDifficulty;
  createdAt: string;
  isPublished: boolean;
}

export interface WorkoutCompletion {
  id: string;
  userId: string;
  workoutId: string;
  completedAt: string;
}
