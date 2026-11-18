# Наступні кроки аудиту та консолідації

Порядок нижче зберігає user data і production середовище та не змінює `main` автоматично.

1. Дочекатися повного завершення MarshGO PR run `38297112997`; розібрати кожний browser E2E/browser-compat результат і, якщо є дефект, виправити product code та повторити сценарій без видалення тестів.
2. Завершити репозиторійний security review: перевірити актуальні Gitleaks/CodeQL/dependency результати для кожної робочої гілки й зафіксувати тільки sanitized evidence.
3. Перенести підтверджений коридорний carpool search і `other_date` fallback у MarshGO-Server разом із PostGIS API integration tests; перевірити зворотний напрямок, дату, вільні місця та відсутній route geometry.
4. Провести runtime diff Server/legacy для ETA, vehicle cache та GTFS poller; додати лише ту поведінку, якої цільовий Server справді не має. Підтвердити stale GPS semantics тестом.
5. Створити database schema/migration equivalence matrix й прогнати upgrade rehearsal на знищуваній копії/окремому ephemeral DB, перш ніж торкатися спільної БД.
6. Перевірити кожний legacy E2E сценарій проти Server + Site: водій/пасажир, бронювання, зміни й зустрічні пропозиції, чат, Rescue, permissions, пошук/мапа, збереження пошуку після restart. Перенести тести до цільових owners.
7. Перевірити Site API contract проти актуального Server, світлу/темну тему, канонічні results/detail map flows, accessibility і browser compatibility на Chromium/Firefox/WebKit.
8. Оновити iOS pin на перевірений immutable Site SHA; виконати sync і Simulator build; зафіксувати окремий фізичний iPhone plan для GPS/APNs/background/deep links.
9. Визначити, де житимуть release orchestration, Compose deployment та backup scripts у трьох основних репозиторіях; довести збірку з чистих SHA і restore з backup.
10. Виконати staging acceptance з тестовими credentials/даними та операційними метриками; зафіксувати усі зовнішні інтеграції як підключені або `BLOCKED_EXTERNAL`.
11. Сформувати readiness percentages за методикою `04_READINESS_REPORT.md`, точний release manifest і фінальний archive readiness report.
12. Лише після повного порівняння refs/тегів, перевірки Git bundle restore, відсутності legacy dependency і окремого підтвердження власника — розглядати GitHub archive. Production deployment/TestFlight/App Store publication мають окреме підтвердження.


## Наступні кроки, станом на останній CI

1. Завершити root робочі зміни E2E/manifest/аудитних звітів, перевірити локальні suites і push у `codex/marshgo-production`.
2. Перевірити root CI з Server `4e32ac3…`, Site `570ea7b…`: дослідити traces усіх невдалих E2E, виправити функціональні дефекти (не знімати assertions), повторити до повного проходження; після E2E має пройти browser-compat.
3. Перевірити оновлений manifest та відповідність трьох точних SHA; залишити `NOT_RELEASED`.
4. Завершити parity inventory GPS polling/cache, lifecycle/Rescue, notifications/push, provider registry і всіх міграцій між legacy та target Server.
5. Провести schema diff і upgrade rehearsal на ізольованій копії, не на існуючій чи production БД.
6. Узгодити власників release orchestration, Docker/deployment, backup/restore і E2E так, щоб не вимагати активного запису у legacy.
7. Перевірити PR mergeability із main і вирішувати міграцію окремими reviewable змінами; не merge-ити автоматично.
8. Отримати партнерські доступи, staging credentials, юридичні дозволи й дані; позначати відсутні інтеграції `BLOCKED_EXTERNAL`.
9. Виконати staging smoke, backup/restore, навантажувальні профілі та iPhone field acceptance.
10. Після повного перенесення повторно оцінити archive readiness; нічого не архівувати без окремого підтвердження.
