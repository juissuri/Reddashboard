# Neon Daily Dashboard

Кастомный плагин для Obsidian: дашборд ежедневных задач в стиле киберпанк
(чёрный фон + неоновый красный), только для десктопной версии Obsidian.

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

## Что реализовано по ТЗ

- 4 папки-виджета: **My Projects**, **Language Learning**, **Material Review**, **New Tasks**.
- Клик по папке открывает рабочую область с доской Kanban: **Do Now / Do Next / Later / Done**.
- Карточки задач: текст, дедлайн, цветной тег приоритета (High — красный, Medium — жёлтый, Low — серый).
- Клик по карточке открывает модальное окно редактирования (текст, дата, приоритет, удаление).
- Поле быстрого добавления задачи в каждой колонке.
- Кольцевой прогресс (выполнено сегодня), горизонтальные бары по под-проектам, линейный график за 7 дней.
- Drag-and-drop с плавным «раздвиганием» соседних карточек, hover-эффект (scale 1.05 + неоновое красное свечение), подсветка зоны сброса, красная «рябь» при переносе карточки в Done.
- Анимированный счётчик процентов в кольце, эластичное заполнение горизонтальных баров, анимация «прорисовки» линии тренда со свечением.
- Открытие папки — slide-up + fade-in. Модалка — scale-up от места клика по карточке.
- Skeleton-заглушки (шиммер) при первом рендере графиков.
- Данные хранятся в `data.json` в папке плагина (`.obsidian/plugins/neon-daily-dashboard/data.json`) — это стандартный механизм `loadData()/saveData()` Obsidian, который физически создаёт и читает именно `data.json`.
- При первом запуске `data.json` автоматически заполняется тестовыми данными:
  - **My Projects → Cargo 083**: «Configure nodes in Gaea for sand texture» (High, дедлайн сегодня), «Import assets to Unreal Engine 5» (Medium, дедлайн +3 дня).
  - **Language Learning**: «A1 test on Friday» (High), «Review vocabulary» (Low, дедлайн завтра).

### Важное про шрифт

В ТЗ указан шрифт «Intel» (корпоративный шрифт Intel Corporation — Intel One/Intel Clear).
Это проприетарный шрифт, который нельзя легально встроить в открытый репозиторий.
В `styles.css` он прописан первым в стеке (`--ndd-font`), поэтому если у вас
установлен `Intel One Text` или `Intel Clear` локально — он подхватится
автоматически. Иначе используется похожий геометричный fallback
(`Eurostile`, `Rajdhani`, системный sans). Если нужен 1:1 шрифт — установите
его на своей машине (лицензию Intel не распространяет публично для сторонних
проектов), ничего в коде менять не придётся.

---

## Шаг 1. Установите инструменты

Нужен установленный **Node.js** (18+) и **npm**. Проверьте:

```bash
node -v
npm -v
```

## Шаг 2. Соберите плагин локально

1. Распакуйте архив `neon-daily-dashboard` в отдельную папку.
2. В терминале перейдите в неё и установите зависимости:

   ```bash
   cd neon-daily-dashboard
   npm install
   ```

3. Соберите продакшн-версию (создаст `main.js` из TypeScript-исходников):

   ```bash
   npm run build
   ```

   После сборки в корне появится файл `main.js`. Для разработки с
   автопересборкой при изменениях используйте `npm run dev`.

## Шаг 3. Проверьте локально в Obsidian (по желанию, но рекомендуется)

1. Найдите папку хранилища (vault) Obsidian → `.obsidian/plugins/`.
2. Создайте там папку `neon-daily-dashboard`.
3. Скопируйте в неё три файла: `manifest.json`, `main.js`, `styles.css`.
4. В Obsidian: **Settings → Community plugins** → отключите «Restricted
   mode», если включён → найдите «Neon Daily Dashboard» в списке
   установленных → включите.
5. Откройте дашборд через иконку на боковой ленте или командой
   **«Open Neon Daily Dashboard»** (Ctrl/Cmd+P).

## Шаг 4. Публикация на GitHub

1. Создайте новый публичный репозиторий на GitHub, например
   `neon-daily-dashboard`.
2. В корне репозитория должны лежать: `manifest.json`, `main.ts`, `src/`,
   `styles.css`, `package.json`, `tsconfig.json`, `esbuild.config.mjs`,
   `versions.json`, `version-bump.mjs`, `.gitignore`, `README.md`
   (то есть весь исходный код — так удобнее развивать плагин дальше).
3. Инициализируйте git и запушьте:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Neon Daily Dashboard"
   git branch -M main
   git remote add origin https://github.com/<ваш-логин>/neon-daily-dashboard.git
   git push -u origin main
   ```

4. Соберите плагин (`npm run build`), затем создайте **GitHub Release**:
   - На странице репозитория → **Releases → Draft a new release**.
   - Тег версии — **строго** как в `manifest.json`, например `1.0.0`
     (без буквы «v»).
   - В **Assets** релиза прикрепите три файла из корня проекта:
     `manifest.json`, `main.js`, `styles.css`.
   - Опубликуйте релиз.

   Это ключевой момент: BRAT ставит плагин именно из assets релиза, а не
   из исходников репозитория напрямую.

## Шаг 5. Установка через BRAT

1. В Obsidian установите плагин **BRAT** (Beta Reviewers Auto-update Tool)
   через **Settings → Community plugins → Browse** и включите его.
2. Откройте настройки BRAT → **Add Beta plugin**.
3. Вставьте ссылку на ваш репозиторий:
   `https://github.com/<ваш-логин>/neon-daily-dashboard`.
4. Выберите версию (последний релиз) и подтвердите добавление.
5. BRAT скачает `manifest.json`, `main.js`, `styles.css` из релиза и
   установит плагин автоматически. Останется включить его в
   **Settings → Community plugins**, как обычный плагин.

## Дальнейшие обновления

При изменении кода: поднимите версию в `package.json`, выполните
`npm run version` (обновит `manifest.json` и `versions.json`), соберите
(`npm run build`), закоммитьте и создайте новый GitHub Release с новым
тегом и обновлёнными `manifest.json` / `main.js` / `styles.css` в assets.
BRAT подтянет обновление автоматически (или по кнопке «Check for updates»).
