# Тёмная тема для Трекера привычек — Дизайн-план

> **Goal:** Перевести приложение на тёмную тему в стиле Insighter (холодный тёмно-серый + светлые кнопки)

---

## Цветовая палитра

| Роль | Цвет | Hex |
|------|------|-----|
| Фон страницы | Тёмно-серый (холодный) | `#1e1e1e` |
| Карточки | Чуть светлее фона | `#2a2a2a` |
| Границы | Для карточек и кнопок | `#3a3a3a` |
| Заголовки | Белый | `#ffffff` |
| Основной текст | Светло-серый | `#b0b0b0` |
| Кнопки (primary) | Светлый фон | `#f0f0f0` |
| Кнопки (primary текст) | Тёмный | `#1e1e1e` |
| Кнопки (ghost/secondary) | Прозрачный с рамкой | `transparent` + `#3a3a3a` |
| Активное состояние | Серый | `#404040` |

### Статусы привычек (Material Design)

| Статус | Цвет | Hex |
|--------|------|-----|
| Выполнено (done) | Зелёный | `#22c55e` |
| Частично (partial) | Жёлтый | `#eab308` |
| Пропущено (missed) | Красный | `#ef4444` |

---

## Типографика

**Шрифт:** Geist (Google Fonts) — современный sans-serif без засечек.

```css
font-family: 'Geist', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
```

**Варианты насыщенности:** 300, 400, 500, 600, 700

---

## Компоненты стиля (как в Insighter)

### Общие правила

- **Карточки:** Скругление `border-radius: 12px`, фон `#2a2a2a`, граница `1px solid #3a3a3a`
- **Отступы:** Чистые, читаемые отступы (как сейчас — 0.9rem внутри карточек)
- **Тени:** Нет теней (плоский дизайн) или очень мягкие тени для elevation
- **Переходы:** Плавные hover-эффекты (0.2s ease)

### Кнопки

**Primary (светлые):**
```css
background: #f0f0f0;
color: #1e1e1e;
border: none;
border-radius: 8px;
```

**Ghost/Secondary (прозрачные с рамкой):**
```css
background: transparent;
color: #ffffff;
border: 1px solid #3a3a3a;
border-radius: 8px;
```

**Danger:**
```css
background: #ef4444;
color: #ffffff;
```

**Active Status (зелёная):**
```css
background: #22c55e;
color: #ffffff;
```

### Поля ввода

```css
background: #1e1e1e;
border: 1px solid #3a3a3a;
color: #ffffff;
border-radius: 8px;
```

Focus state: `outline: 0.125rem solid #4d65ff` (как в Insighter)

### Навигация (Tabs)

```css
.tab {
  background: #404040;
  color: #ffffff;
}

.tab.active {
  background: #f0f0f0;
  color: #1e1e1e;
}
```

### Баннеры / Уведомления

```css
background: #2a2a2a;
border: 1px solid #3a3a3a;
border-radius: 10px;
```

### Ячейки календаря

```css
.cell { background: #404040; }
.cell.done { background: #22c55e; }
.cell.partial { background: #eab308; }
.cell.missed { background: #ef4444; }
```

---

## Файлы для изменения

| Файл | Что менять |
|------|-----------|
| `index.html` | Подключить Google Fonts (Geist) |
| `src/styles.css` | Полностью переписать на CSS-переменные и тёмную палитру |
| `src/features/habits/ui/HabitForm.tsx` | Проверить цвета свотчей на контраст |
| `src/features/calendar/ui/ProgressCalendar.tsx` | Легенда — цвет текста |
| Все остальные компоненты | Проверить визуально после обновления CSS |

---

## Проверки после реализации

- [ ] Все страницы читаемы в тёмной теме
- [ ] Контраст текста достаточный (WCAA)
- [ ] Статусы привычек ярко различимы
- [ ] Кнопки выглядят интерактивно (hover/focus)
- [ ] `npm run build` проходит без ошибок
- [ ] Визуальная проверка в `npm run preview`

---

## Референс

- Шаблон Insighter (Webflow): холодный тёмно-серый, чистые линии, светлые акценты
- Material Design 3 цвета статусов
- Шрифт Geist (google.com/fonts)
