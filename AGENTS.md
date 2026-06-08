# Agent 规则

## 项目概览

- 当前项目是 `aoi-web-workspace`，一个 pnpm monorepo。
- 核心方向是 Schema 驱动的 Aoi 自构建平台：`apps/builder` 负责构建态，`apps/runtime` 负责干净运行态，`apps/aoi-site` 保留原 Nuxt 视频社区应用作为遗留参考应用。
- 包管理器只使用 pnpm。仓库声明的版本是 `pnpm@10.22.0`。
- 较大的产品、架构、UI、API 或交互变更，需要优先参考 `design/rules.md`。

## 常用命令

- 安装依赖：`pnpm install`
- 启动构建器：`pnpm dev` 或 `pnpm dev:builder`
- 启动运行态模板：`pnpm dev:runtime`
- 启动旧 Aoi 站点：`pnpm dev:aoi-site`
- 类型检查：`pnpm typecheck`
- 构建全部 workspace：`pnpm build`
- 构建运行态产物：`pnpm --filter @aoi/compiler compile:admin-crud`

当前仓库还没有提交 `lint` 脚本。除非后续新增或用户明确提供 lint 命令，否则不要声称已经完成 lint 验证。

## 仓库边界

- `apps/builder` 是独立构建器应用，核心入口为 `/building`。
- `apps/runtime` 是无 builder 的运行态模板；不得引入 `apps/builder` 或 `/building` 路由。
- `apps/aoi-site` 是迁移后的旧 Nuxt 站点，内部仍保留自己的 `app/`、`server/`、`shared/`、`i18n/`。
- `packages/protocol` 放系统 Schema、物料协议、数据模型、动作流、权限和构建目标类型。
- `packages/materials` 放内置物料 manifest 与 Vue 渲染适配器。
- `packages/runtime-core` 放 Schema renderer、binding/action runtime。
- `packages/data-runtime` 放 mock/sqlite-node/http 数据驱动抽象和 Node SQLite adapter。
- `packages/compiler` 放 Schema 到运行态产物的编译器。
- `packages/templates/admin-crud` 放 V1 通用 CRUD 示例 Schema 与 seed。
- 本地 SQLite 文件默认在 `data/projects/{projectId}/project.sqlite`，`data/` 不提交。
- 生成产物默认在 `.aoi/generated/{projectSlug}`，`.aoi/` 不提交。
- 不要编辑 `.nuxt/`、`.output/`、`node_modules/`、`.aoi/`、`data/` 等生成目录或依赖目录。

## 代码风格

- 使用 TypeScript 和 Vue 3 Composition API。
- 遵循现有格式：2 空格缩进、双引号、LF 换行、Vue/TS 文件不加分号。
- 优先使用 workspace 包里的协议、运行时和数据驱动，不在页面里临时拼接 Schema 或 SQL。
- 搜索仓库内容时优先使用 `rg` 或 `rg --files`。

## Builder 与 Runtime 规则

- `/building` 只存在于 `apps/builder`，不得进入 `apps/runtime` 或编译产物。
- Builder 可以读写本地 SQLite 项目库，但 UI 不允许提交任意 SQL。
- 所有 SQLite 表、字段和 CRUD 行为都必须由 `AoiModelSchema` 和 `AoiDataResourceSchema` allowlist 推导。
- Runtime 只能通过 `packages/runtime-core` 渲染 Schema，通过 `packages/data-runtime` 执行受控数据操作。
- 最终产物不得依赖 `@aoi/builder`。
- V1 不实现复合组件自封装和物料市场，只保留协议扩展点。

## 旧 Aoi 站点规则

- 旧站业务页面和功能组件不要直接使用 `md-*` Material Web 元素。
- Material Web 的导入集中在 `apps/aoi-site/app/plugins/material-web.client.ts`。
- 如需暴露新的 Material Web 行为，先在 `apps/aoi-site/app/components/aoi/` 新增或扩展 Aoi wrapper。
- 普通文本链接、卡片链接、标签链接和导航链接统一使用 `AoiLink`。
- 使用 `apps/aoi-site/app/assets/css/tokens.css` 和 `apps/aoi-site/app/assets/css/main.css` 中的共享规则。

## i18n 规则

- 旧站默认语言是 `zh-CN`，路由策略是 `no_prefix`。
- 修改旧站共享用户可见文案时，同步维护 `apps/aoi-site/i18n/locales/zh-CN.json`、`en.json` 和 `ja.json`。

## 验证规则

- 修改 TypeScript、Vue、路由、composable、store 或 workspace 包后，运行 `pnpm typecheck`。
- 修改 Nuxt 配置、server route、runtime config、compiler 或构建敏感模块后，运行 `pnpm build`。
- 可见 UI 变更应尽量在浏览器中检查桌面和移动端表现。
- 如未能运行必要验证，需要在最终回复中说明。

## Git 与协作

- 编辑前先检查工作区状态。
- 不要回滚用户改动或无关脏文件。
- 除非用户明确要求，不要提交、创建分支或推送。
- 只有在通过 pnpm 有意变更依赖时，才保留 lockfile 变化。
