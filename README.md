# Aoi Web

Aoi Web 是一个 Nuxt 4 前端优先的视频社区应用。项目使用 Vue 3、TypeScript、Pinia、`@nuxtjs/i18n`、`@nuxt/icon`，并通过本地 Aoi wrapper 统一封装 Material Web 组件。

当前应用以 Nuxt mock API 和浏览器本地状态为主，覆盖首页发现、分类浏览、搜索、关注动态、视频播放、用户页、历史/收藏、上传草稿和设置中心等前端体验；共享 DTO 与 mock fixture 会尽量贴近未来 Go 后端契约。

## 技术栈

- Nuxt 4 / Vue 3 / TypeScript
- Pinia 状态管理
- `@nuxtjs/i18n` 国际化，默认语言为 `zh-CN`
- `@nuxt/icon`，本地 Lucide 图标集合
- Material Web，经 `app/components/aoi/` 中的 Aoi 组件封装后使用
- Tiptap 富文本编辑器
- Lenis 滚动体验与 NProgress 路由进度反馈

## 快速开始

本仓库只使用 pnpm，声明版本为 `pnpm@10.22.0`。

```bash
pnpm install
pnpm dev
```

默认开发服务通常运行在 `http://localhost:3000`。如端口被占用，请以 Nuxt 输出为准。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务 |
| `pnpm typecheck` | 运行 Nuxt / Vue TypeScript 类型检查 |
| `pnpm build` | 构建生产产物 |
| `pnpm preview` | 预览生产构建 |

当前仓库没有提交 `lint` 脚本。

## 目录结构

```text
app/                         前端应用代码
app/components/aoi/          Aoi UI wrapper 组件
app/assets/css/              设计 token 与全局样式
app/composables/             Nuxt composable
app/stores/                  Pinia store 与浏览器本地状态
app/pages/                   Nuxt 页面路由
app/plugins/                 客户端插件与 Material Web 注册
app/config/                  前端配置与 build default profile
server/api/mock/             Nuxt mock API
server/api/developer/        开发辅助 API
shared/                      app 与 mock API 复用的 DTO、fixture
i18n/locales/                `zh-CN`、`en`、`ja` 文案
design/rules.md              长期产品、架构、UI、API 与交互约束
```

不要编辑 `.nuxt/`、`.output/`、`node_modules/` 等生成目录或依赖目录。

## 运行时配置

Nuxt public runtime config 支持以下环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE_URL` | `/api/mock` | `useAoiApi()` 使用的 API 基础路径 |
| `NUXT_PUBLIC_API_MOCK` | `true` | 设置为 `false` 时关闭 mock 标记 |

应用代码访问 API 时应统一通过 `useAoiApi()`，并保持与 `useAoiApiTelemetry()` 的错误诊断兼容。

## 开发约定

- 使用 TypeScript 与 Vue 3 Composition API。
- 保持 2 空格缩进、双引号、LF 换行，Vue/TS 文件不加分号。
- 业务页面和功能组件不要直接使用 `md-*` Material Web 元素；需要新能力时先扩展 `app/components/aoi/`。
- 普通文本链接、卡片链接、标签链接和导航链接统一使用 `AoiLink`。
- 样式优先使用 `app/assets/css/tokens.css` 中的 CSS 变量和 `app/assets/css/main.css` 中的共享布局规则。
- 新增共享用户可见文案时，同步维护 `i18n/locales/zh-CN.json`、`i18n/locales/en.json` 和 `i18n/locales/ja.json`。
- 浏览器本地 store 必须只在客户端安全 hydrate，并能从损坏的 `localStorage` 恢复。
- 上传草稿状态不要持久化文件字节，只保存文件元数据。

较大的产品、架构、UI、API 或交互变更，应先参考 `design/rules.md`。

## 验证

- 修改 TypeScript、Vue、路由、composable 或 store 后，运行 `pnpm typecheck`。
- 修改 Nuxt 配置、server route、runtime config 或构建敏感模块后，运行 `pnpm build`。
- 可见 UI 变更应尽量在浏览器中检查桌面和移动端表现。
- 除非后续新增脚本或明确提供命令，不要声称已经完成 lint 验证。

## 贡献者

- [Rin721](https://github.com/Rin721)
