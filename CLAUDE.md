# Mini Mall

微型电商系统，支持商品浏览、购物车、下单支付、后台管理、会员等级折扣。

## 技术栈

- **框架**: Next.js 16 (App Router, Server Actions)
- **语言**: TypeScript 5 (严格模式)
- **ORM**: Prisma 5 + SQLite
- **样式**: TailwindCSS 4 + shadcn/ui
- **认证**: Auth.js (NextAuth.js v5) + Credentials Provider + JWT Strategy
- **验证**: Zod (前后端共享 schema)
- **密码加密**: bcryptjs

## 目录结构

```
app/
  (shop)/                # 前台路由组
    page.tsx             # 首页 = 商品列表 + 搜索 + 分类筛选
    products/[id]/page.tsx
    cart/page.tsx
    orders/page.tsx
    layout.tsx           # 前台布局（Header + Footer）
  (admin)/               # 后台路由组
    admin/layout.tsx     # 后台布局（Sidebar + 权限守卫）
    admin/dashboard/page.tsx
    admin/products/page.tsx
    admin/orders/page.tsx
    admin/categories/page.tsx
  api/auth/[...nextauth]/route.ts
  globals.css
  layout.tsx
components/
  ui/                    # shadcn/ui 基础组件
  shop/                  # 前台业务组件
  admin/                 # 后台业务组件
lib/
  prisma.ts              # Prisma Client 单例
  auth.ts                # Auth.js 配置
  permissions.ts         # RBAC 权限检查
  actions/               # Server Actions
    auth.ts
    product.ts
    category.ts
    cart.ts
    order.ts
  utils.ts               # cn() 等工具
prisma/
  schema.prisma
  seed.ts                # 初始化角色、权限、管理员、演示数据
public/
  uploads/               # 商品图片上传目录（开发环境）
```

## 数据库 Schema

### 用户与 RBAC

```prisma
model User {
  id              String          @id @default(cuid())
  email           String          @unique
  name            String?
  password        String          // bcrypt hash
  roleId          String
  role            Role            @relation(fields: [roleId], references: [id])
  membershipLevel MembershipLevel @default(NONE)
  totalSpent      Decimal         @default(0) @db.Decimal(12, 2)
  cartItems       CartItem[]
  orders          Order[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum MembershipLevel {
  NONE
  LEVEL_1
  LEVEL_2
  LEVEL_3
}

model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  permissions RolePermission[]
  users       User[]
}

model Permission {
  id    String           @id @default(cuid())
  name  String           @unique
  roles RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}
```

### 商品与分类

```prisma
model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id          String     @id @default(cuid())
  name        String
  description String?
  price       Decimal    @db.Decimal(10, 2)
  stock       Int        @default(0)
  image       String?
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id])
  cartItems   CartItem[]
  orderItems  OrderItem[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### 购物车

```prisma
model CartItem {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int     @default(1)
  @@unique([userId, productId])
}
```

### 订单与支付

```prisma
model Order {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  items         OrderItem[]
  originalTotal Decimal     @db.Decimal(10, 2)
  discountRate  Decimal     @default(1) @db.Decimal(3, 2)
  total         Decimal     @db.Decimal(10, 2)
  status        OrderStatus @default(PENDING)
  address       String
  phone         String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  payments      Payment[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // 下单时快照价格
}

model Payment {
  id        String        @id @default(cuid())
  orderId   String
  order     Order         @relation(fields: [orderId], references: [id])
  amount    Decimal       @db.Decimal(10, 2)
  status    PaymentStatus @default(PENDING)
  method    String        @default("mock")
  createdAt DateTime      @default(now())
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}
```

## 核心业务流程

### 1. 认证
- 注册：`register()` Server Action 创建用户，默认 role 为 operator，密码 bcrypt hash
- 登录：Auth.js Credentials Provider 验证邮箱密码，返回 JWT（含 role 和 permissions）
- 权限中间件：`middleware.ts` 保护 `/admin/*`，未登录重定向，非管理员 403

### 2. 下单（含会员折扣）
1. 购物车 → 点击结算
2. `createOrder` 读取用户 `membershipLevel`，计算折扣率
3. `originalTotal = Σ(商品单价 × 数量)`，`total = originalTotal × discountRate`
4. 事务内：创建 Order + OrderItems + 扣库存 + 清空购物车
5. 创建 Payment（PENDING，金额 = total）
6. 跳转订单详情，显示原价、折扣率、实付金额

### 3. 模拟支付与会员升级
1. `mockPay(orderId)` → Payment SUCCESS → Order.status = PAID
2. 累加 `user.totalSpent += order.total`
3. 检查升级：
   - `totalSpent ≥ 800000` 且 level < LEVEL_3 → 升级 LEVEL_3
   - `totalSpent ≥ 80000` 且 level < LEVEL_2 → 升级 LEVEL_2
   - `totalSpent ≥ 8000` 且 level < LEVEL_1 → 升级 LEVEL_1
4. 若升级，前端显示升级提示

### 4. 折扣规则

| 等级 | 累计消费 | 折扣率 |
|------|---------|--------|
| NONE | 0 | 1.00 |
| LEVEL_1 | 8,000 | 0.95 |
| LEVEL_2 | 80,000 | 0.90 |
| LEVEL_3 | 800,000 | 0.80 |

## RBAC 权限模型

预置角色：
- `super_admin`：全部权限
- `admin`：user:read, product:*, order:*, category:*
- `operator`：product:read, order:read/write, category:read

权限检查：
- 前端：根据 `session.permissions` 动态渲染菜单和操作按钮
- 服务端：每个 Admin Server Action 开头调用 `checkPermission("xxx:write")`

## 开发命令

```bash
# 安装依赖
npm install

# 数据库迁移（修改 schema 后执行）
npx prisma migrate dev --name <migration-name>

# 数据库种子（初始化角色、权限、管理员、演示数据）
npx prisma db seed

# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start
```

## 约定

- Server Actions 统一放在 `lib/actions/` 目录，按模块分文件
- 表单验证使用 Zod schema，前后端共享
- Prisma 查询在 Server Actions 中直接调用，不额外封装 Service 层（保持简单）
- 图片上传开发环境存 `public/uploads/`，生产环境建议迁移到对象存储
- 所有金额使用 `Decimal` 类型，避免浮点精度问题

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->

---

## 独立技能包

### git-commit

在提交代码时，自动生成符合 Conventional Commits 规范的 commit message。

**触发方式**：`/git-commit` 或提交代码前自动触发

**执行步骤**：
1. 运行 `git diff --staged` 查看暂存区修改
2. 分析变更类型（feat/fix/refactor/style/docs/test/chore）
3. 生成格式：`<type>(<scope>): <description>`
4. 用户确认后执行 `git commit`

**文件位置**：`.claude/skills/git-commit/SKILL.md`

### api-crud-generator

根据指定的 Prisma 模型，自动生成标准的管理后台 CRUD 代码。

**触发方式**：用户提及"生成CRUD"、"生成接口"、"生成管理页面"时触发

**生成内容**：
| 输出 | 文件 | 说明 |
|------|------|------|
| API Routes | `route.ts` | GET 列表 + POST 创建 |
| API Routes | `[id]/route.ts` | GET 详情 + PUT 更新 + DELETE 删除 |
| 前端页面 | `page.tsx` | 数据表格 + 新增/编辑/删除 |

**执行步骤**：
1. 确认模型名称、API 路径、页面路由
2. 生成 API Route handlers（标准 5 个接口）
3. 生成前端管理页面（表格 + 表单 + TailwindCSS）
4. 列出文件、提醒 `prisma generate`、给出测试方法

**内置约束**：
- UI 文案使用中文
- 使用 Next.js App Router 的 `params` 语法
- 创建/更新前做输入验证
- 密码字段永不通过 API 返回

**文件位置**：`.claude/skills/api-crud-generator/SKILL.md`
