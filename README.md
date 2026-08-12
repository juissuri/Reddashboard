# Red Daily Dashboard

Кастомный плагин для Obsidian: дашборд ежедневных задач, только для десктопной версии Obsidian.

## Структура проекта

```
neon-daily-dashboard/
├── manifest.json          # метаданные плагина (id, версия, minAppVersion, isDesktopOnly)
├── package.json           # npm-скрипты и зависимости для сборки
├── tsconfig.json          # конфигурация TypeScript
├── esbuild.config.mjs     # сборка main.ts → main.js
├── version-bump.mjs       # скрипт для обновления версии при релизе
├── versions.json          # карта совместимости версия плагина → версия Obsidian
├── styles.css             # вся визуальная тема и анимации
├── main.ts                # точка входа плагина (класс Plugin)
└── src/
    ├── types.ts            # типы: TaskItem, FolderDef, DashboardData, Priority, ColumnId
    ├── data.ts             # утилиты дат/id + генерация дефолтных тестовых данных
    ├── charts.ts           # три графика: кольцо, горизонтальные бары, линия тренда + скелетоны
    ├── kanban.ts            # доска Kanban: колонки, drag-and-drop, карточки, быстрое добавление
    ├── modal.ts             # модальное окно редактирования задачи
    └── view.ts               # ItemView дашборда: сетка папок + рабочая область
```

