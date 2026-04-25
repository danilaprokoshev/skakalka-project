import { format } from 'date-fns';

export const toDayKey = (date: Date): string => format(date, 'yyyy-MM-dd');
