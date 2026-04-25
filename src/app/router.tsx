import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { HabitsPage } from '../pages/HabitsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: 'habits',
        element: <HabitsPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      }
    ]
  }
]);
