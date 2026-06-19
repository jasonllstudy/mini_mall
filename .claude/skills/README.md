# Superpowers Skills 索引

本项目已加载 superpowers-zh 技能框架，共 20 个 skills。

## 流程类（Process）

| Skill | 触发场景 | 说明 |
|-------|---------|------|
| `brainstorming` | 任何创造性工作之前 | 创建功能、构建组件、添加功能或修改行为前，先探索用户意图、需求和设计 |
| `test-driven-development` | 实现功能或修复 bug 时 | 先写测试，再写实现代码 |
| `systematic-debugging` | 遇到 bug、测试失败或异常行为时 | 系统化调试流程，先诊断再修复 |
| `dispatching-parallel-agents` | 2+ 独立任务可并行时 | 分派并行子代理处理无依赖的任务 |
| `subagent-driven-development` | 执行包含独立子任务的实现计划时 | 用子代理驱动开发 |
| `executing-plans` | 有书面实现计划需要跨会话执行时 | 带审查检查点的计划执行 |
| `finishing-a-development-branch` | 实现完成、测试通过、需要集成时 | 合并、PR 或清理的收尾引导 |
| `verification-before-completion` | 宣称完成、修复或测试通过之前 | 必须运行验证命令并确认输出 |
| `requesting-code-review` | 完成任务、实现重要功能或合并前 | 验证工作成果是否符合要求 |
| `receiving-code-review` | 收到代码审查反馈后、实施建议前 | 技术严谨性验证，不盲目执行 |
| `using-git-worktrees` | 需要隔离的功能开发或执行计划前 | 确保隔离工作区存在 |
| `writing-plans` | 有规格说明或需求用于多步骤任务时 | 动手写代码之前制定计划 |
| `writing-skills` | 创建新技能、编辑现有技能或验证时 | 技能开发方法论 |
| `workflow-runner` | 用户提供 .yaml 工作流文件时 | 多角色协作完成任务 |

## 中国特色技能

| Skill | 触发场景 | 说明 |
|-------|---------|------|
| `chinese-code-review` | 代码审查且团队使用中文沟通时 | 话术模板、分级标注、国内反模式应对 |
| `chinese-commit-conventions` | 编写 git commit message（中文项目） | Conventional Commits 中文适配 |
| `chinese-documentation` | 编写中文技术文档或 README | 中英文空格、全半角标点、术语保留 |
| `chinese-git-workflow` | 使用 Gitee/Coding/极狐 GitLab | SSH/HTTPS/凭据/CI 接入差异与镜像同步 |

## 工具类

| Skill | 触发场景 | 说明 |
|-------|---------|------|
| `mcp-builder` | 构建 MCP 服务器/工具时 | 系统化构建生产级 MCP 工具 |

## 使用规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 文件位置

每个 skill 位于 `.claude/skills/<skill-name>/SKILL.md`，包含完整的指令和规则。
