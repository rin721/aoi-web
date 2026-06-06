# Agent 规则

## 项目概览

- 当前项目是 `aoi-web`，一个 Nuxt 4 前端优先应用，使用 Vue 3、TypeScript、Pinia、`@nuxtjs/i18n`、`@nuxt/icon`，并通过本地 Aoi wrapper 封装 Material Web。
- 包管理器只使用 pnpm。仓库声明的版本是 `pnpm@10.22.0`。
- 当前应用以本地 mock API 和浏览器本地状态为主，同时保留面向未来 Go 后端的类型契约。
- 较大的产品、架构、UI、API 或交互变更，需要优先参考 `design/rules.md`。

## 常用命令

- 安装依赖：`pnpm install`
- 启动开发服务：`pnpm dev`
- 类型检查：`pnpm typecheck`
- 构建：`pnpm build`
- 预览生产构建：`pnpm preview`

当前仓库还没有提交 `lint` 脚本。除非后续新增或用户明确提供 lint 命令，否则不要声称已经完成 lint 验证。

## 仓库边界

- 前端应用代码位于 `app/`。
- 需要被 app 代码和 mock server 复用的 DTO、fixture 放在 `shared/`。
- Nuxt mock 接口位于 `server/api/mock/`；不要把它扩展成生产后端。
- 本地化文案位于 `i18n/locales/`。
- 长期设计、技术、API 和交互约束位于 `design/rules.md`；`design/` 不保留临时研究、原型或阶段计划。
- 不要编辑 `.nuxt/`、`.output/`、`node_modules/` 等生成目录或依赖目录。
- 内部连接和导入应该优先使用相对路径或 Nuxt 自动导入；避免引入不必要的全局工具或模块。

## 代码风格

- 使用 TypeScript 和 Vue 3 Composition API。
- 遵循现有格式：2 空格缩进、双引号、LF 换行、Vue/TS 文件不加分号。
- 优先使用 Nuxt 自动导入和本地 composable，不随意新增全局工具。
- 变更保持聚焦，避免无关重构。
- 搜索仓库内容时优先使用 `rg` 或 `rg --files`。

## UI 与组件规则

- 业务页面和功能组件不要直接使用 `md-*` Material Web 元素。
- Material Web 的导入集中在 `app/plugins/material-web.client.ts`。
- 如需暴露新的 Material Web 行为，先在 `app/components/aoi/` 新增或扩展 Aoi wrapper。
- 优先使用已有 Aoi 组件，例如 `AoiLink`、`AoiButton`、`AoiIconButton`、`AoiTextField`、`AoiTabs`、`AoiCheckbox`、`AoiDialog`、`AoiMenu`、`AoiProgress`。
- 普通文本链接、卡片链接、标签链接和导航链接统一使用 `AoiLink`；业务代码不要直接使用 `NuxtLink` 或裸 `<a>`。
- 按钮式导航继续使用 `AoiButton` 或 `AoiIconButton`，它们的 `to`/`href` 会委托给 `AoiLink`。
- 使用 `app/assets/css/tokens.css` 中的 CSS 变量，以及 `app/assets/css/main.css` 中的共享布局规则。
- 保持响应式行为、可访问标签、键盘焦点、触控尺寸和 reduced-motion 支持。
- 图标优先通过 `@nuxt/icon` 使用本地 Lucide 集合，避免远程图标依赖。

## 状态、API 与数据规则

- API 访问统一走 `useAoiApi()`，并保持错误诊断与 `useAoiApiTelemetry()` 兼容。
- 面向未来后端的 DTO 形状应放在共享类型中。已有共享契约时，避免在页面里临时拼接响应结构。
- 浏览器本地 store 必须只在客户端安全 hydrate，能从损坏的 `localStorage` 恢复，并避免 SSR 崩溃。
- mock 接口应尽量贴近未来真实 API 契约。
- 上传草稿状态不要持久化文件字节，只能保存文件元数据。

## i18n 规则

- 默认语言是 `zh-CN`，路由策略是 `no_prefix`。
- 新增共享用户可见文案时，同步维护 `zh-CN.json`、`en.json` 和 `ja.json`。
- 部分现有功能页仍有内联中文文案。大幅触碰这些区域时，优先把可复用文案迁移到 locale 文件。

## 验证规则

- 修改 TypeScript、Vue、路由、composable 或 store 后，运行 `pnpm typecheck`。
- 修改 Nuxt 配置、server route、runtime config 或构建敏感模块后，运行 `pnpm build`。
- 可见 UI 变更应尽量在浏览器中检查桌面和移动端表现。
- 如未能运行必要验证，需要在最终回复中说明。

## Git 与协作

- 编辑前先检查工作区状态。
- 不要回滚用户改动或无关脏文件。
- 除非用户明确要求，不要提交、创建分支或推送。
- 只有在通过 pnpm 有意变更依赖时，才保留 lockfile 变化。
