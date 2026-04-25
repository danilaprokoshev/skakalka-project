import { Reminder } from '../../habits/model/types';

const LAST_FIRE_PREFIX = 'habit-reminder-last-fire:';

export const supportsNotifications = (): boolean => typeof window !== 'undefined' && 'Notification' in window;

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!supportsNotifications()) {
    return 'unsupported';
  }

  return Notification.requestPermission();
};

const shouldTriggerForToday = (reminder: Reminder, now: Date): boolean => {
  const day = now.getDay();
  if (reminder.daysOfWeek.length === 0) {
    return true;
  }

  return reminder.daysOfWeek.includes(day);
};

const sameMinute = (time: string, now: Date): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  return now.getHours() === hours && now.getMinutes() === minutes;
};

const alreadyTriggeredThisMinute = (habitId: string, now: Date): boolean => {
  const key = `${LAST_FIRE_PREFIX}${habitId}`;
  return localStorage.getItem(key) === now.toISOString().slice(0, 16);
};

const markTriggered = (habitId: string, now: Date): void => {
  const key = `${LAST_FIRE_PREFIX}${habitId}`;
  localStorage.setItem(key, now.toISOString().slice(0, 16));
};

export const shouldShowInAppReminder = (reminder: Reminder, now: Date): boolean => {
  if (!reminder.enabled || !reminder.time) {
    return false;
  }

  return shouldTriggerForToday(reminder, now) && sameMinute(reminder.time, now) && !alreadyTriggeredThisMinute(reminder.habitId, now);
};

export const dispatchReminder = (habitTitle: string): void => {
  if (supportsNotifications() && Notification.permission === 'granted') {
    new Notification('Напоминание: чек-ин привычки', {
      body: `Не забудьте отметить прогресс по привычке «${habitTitle}» сегодня.`
    });
  }
};

export const markReminderAsDelivered = (habitId: string, now: Date): void => {
  markTriggered(habitId, now);
};
