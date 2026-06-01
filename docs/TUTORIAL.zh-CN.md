# EnvGuard 使用教程

[English README](../README.md)

## 目录

- [项目介绍](#项目介绍)
- [安装](#安装)
- [快速上手](#快速上手)
- [命令详解](#命令详解)
- [交互式 TUI 模式](#交互式-tui-模式)
- [典型使用场景](#典型使用场景)
- [CI 集成示例](#ci-集成示例)
- [退出码说明](#退出码说明)
- [安全与脱敏](#安全与脱敏)
- [常见问题](#常见问题)

---

## 项目介绍

**EnvGuard** 是一个面向开发者的 `.env` 环境变量安全对比工具。

在日常开发中，我们经常会遇到这些场景：

- 本地 `.env` 和 `.env.example` 不一致，不知道漏了哪些变量
- 开发环境和生产环境的配置差异难以追踪
- 不小心把 API Key、Token 写进了 env 文件或提交到了 Git
- 用 `diff` 或肉眼对比 env 文件时，敏感值直接暴露在终端里

EnvGuard 就是为了解决这些问题而生的。它可以：

1. **对比两个 env 文件**，清晰列出新增、删除、修改、未变更的变量
2. **默认脱敏输出**，避免密钥在终端或日志中泄露
3. **检测常见密钥格式**，如 OpenAI、GitHub Token、AWS Key、JWT 等
4. **支持命令行和交互式 TUI 两种模式**，既适合本地调试，也适合接入 CI

### 核心特性

| 特性 | 说明 |
|------|------|
| 差异分类 | 自动识别 added / removed / changed / unchanged |
| 默认脱敏 | 敏感 key 全遮罩，普通值保留首尾字符 |
| 密钥检测 | 命名规则 + 格式匹配 + 高熵字符串检测 |
| 双模式 | CLI 命令行 + Ink 交互界面 |
| JSON 输出 | 适合脚本和 CI 流水线 |
| 零配置 | 克隆即用，无需额外配置文件 |

---

## 安装

### 方式一：从 GitHub 克隆（推荐）

```bash
git clone https://github.com/wanghaofu124/envguard-cli.git
cd envguard-cli
npm install
npm run build
```

构建完成后，通过以下方式运行：

```bash
node bin/envguard.js --help
```

### 方式二：全局链接（本地开发）

```bash
cd envguard-cli
npm link
envguard --help
```

---

## 快速上手

项目自带测试样例，可以直接体验：

```bash
# 对比 example 与 dev 环境
node bin/envguard.js diff fixtures/.env.example fixtures/.env.dev

# 对比 example 与 prod 环境（含更多密钥告警）
node bin/envguard.js diff fixtures/.env.example fixtures/.env.prod

# 扫描单个文件中的密钥
node bin/envguard.js check fixtures/.env.prod

# 进入交互式界面
node bin/envguard.js
```

### 输出示例（diff）

```
EnvGuard Diff
A: .../fixtures/.env.example
B: .../fixtures/.env.prod

+ ADDED (2)
  GITHUB_TOKEN = **** [!secret]
  NEWRelic_KEY = pr***ue

~ CHANGED (5)
  - APP_ENV = de***nt
  + APP_ENV = pr***on
  ...

Secrets detected: 6
  ERROR GITHUB_TOKEN: GitHub personal access token
  WARN DB_PASSWORD: Sensitive key name
```

---

## 命令详解

### `envguard diff` — 对比两个 env 文件

```bash
envguard diff <fileA> <fileB> [options]
```

**参数：**

| 参数 | 说明 |
|------|------|
| `fileA` | 基准文件（通常是 `.env.example`） |
| `fileB` | 对比文件（通常是 `.env` 或 `.env.prod`） |

**选项：**

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--format text\|json` | `text` | 输出格式 |
| `--all` | `false` | 同时显示未变更的变量 |
| `--no-redact` | 关闭 | 显示明文值（**不安全，慎用**） |

**示例：**

```bash
# 基础对比
envguard diff .env.example .env

# 显示所有变量（含未变更）
envguard diff .env.example .env --all

# JSON 输出，便于脚本处理
envguard diff .env.example .env --format json

# 开发调试时查看明文（仅限本地可信环境）
envguard diff .env.example .env --no-redact
```

**差异类型说明：**

| 类型 | 含义 | 示例 |
|------|------|------|
| `ADDED` | 仅 fileB 中存在 | 新增了 `LOG_LEVEL` |
| `REMOVED` | 仅 fileA 中存在 | 删除了某个废弃变量 |
| `CHANGED` | 两边都有但值不同 | `API_URL` 从 dev 变为 prod |
| `UNCHANGED` | 两边值相同 | `APP_NAME` 未变 |

---

### `envguard check` — 扫描单个 env 文件

```bash
envguard check <file> [options]
```

**选项：**

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--format text\|json` | `text` | 输出格式 |
| `--strict` | `false` | 有任何告警时 exit code 为 1 |
| `--no-redact` | 关闭 | 显示明文值（**不安全**） |

**示例：**

```bash
# 扫描当前 .env
envguard check .env

# 严格模式：有 warning 也返回失败
envguard check .env --strict

# JSON 输出
envguard check .env --format json
```

**检测规则：**

| 级别 | 规则 | 示例 |
|------|------|------|
| warning | 敏感 key 名 | `PASSWORD`、`SECRET`、`TOKEN`、`API_KEY` |
| warning | 高熵字符串（≥32 位） | 长随机字符串 |
| error | OpenAI Key | `sk-...` |
| error | GitHub Token | `ghp_...` |
| error | AWS Access Key | `AKIA...` |
| error | JWT | `eyJ...eyJ...` |

---

## 交互式 TUI 模式

不带任何参数运行，进入交互界面：

```bash
envguard
```

### 操作流程

1. 输入 **文件 A** 路径（如 `.env.example`）
2. 输入 **文件 B** 路径（如 `.env`）
3. 进入 diff 视图，浏览结果

### 快捷键

| 按键 | 功能 |
|------|------|
| `Tab` | 切换视图：仅差异 → 全部条目 → 密钥告警 |
| `q` | 退出 |
| `Ctrl+C` | 强制退出 |

### 三种视图

1. **differences only** — 只显示有变化的变量（默认）
2. **all entries** — 包含未变更的变量
3. **secret alerts** — 只显示检测到的密钥告警

---

## 典型使用场景

### 场景 1：检查本地 .env 是否漏配变量

```bash
envguard diff .env.example .env
```

如果输出中有 `REMOVED` 项，说明 `.env.example` 里有但你的 `.env` 里没有，可能漏配了。

如果输出中有 `ADDED` 项，说明 `.env` 里有但 example 里没有，考虑是否要更新 `.env.example`。

### 场景 2：对比开发与生产配置

```bash
envguard diff .env.dev .env.prod --all
```

快速看清两个环境的所有配置差异。

### 场景 3：提交前检查是否含真实密钥

```bash
envguard check .env --strict
```

在 git commit 前运行，若 exit code 为 1，说明检测到可疑密钥。

### 场景 4：团队 onboarding

新成员克隆项目后：

```bash
cp .env.example .env
envguard diff .env.example .env
```

确认所有必填变量都已填写。

---

## CI 集成示例

### GitHub Actions

```yaml
name: Env Check

on: [pull_request]

jobs:
  envguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install EnvGuard
        run: |
          git clone https://github.com/wanghaofu124/envguard-cli.git /tmp/envguard
          cd /tmp/envguard && npm ci && npm run build

      - name: Check .env.example vs template
        run: |
          node /tmp/envguard/bin/envguard.js check .env.example --strict
        continue-on-error: true

      - name: Diff env files
        run: |
          node /tmp/envguard/bin/envguard.js diff .env.example .env.sample --format json
        if: hashFiles('.env.sample') != ''
```

### Shell 脚本中使用 JSON 输出

```bash
#!/bin/bash
result=$(envguard diff .env.example .env --format json)
added=$(echo "$result" | jq '.added | length')
echo "新增变量数: $added"

if [ "$(echo "$result" | jq '.secrets | length')" -gt 0 ]; then
  echo "警告：检测到密钥！"
  exit 1
fi
```

---

## 退出码说明

| 退出码 | 含义 | 常见原因 |
|--------|------|----------|
| `0` | 成功 | 无高风险密钥 |
| `1` | 检测到问题 | 发现 error 级密钥，或 `--strict` 下有 warning |
| `2` | 运行错误 | 文件不存在、路径无效、解析失败 |

在 CI 中可通过 `$?` 或 `$LASTEXITCODE` 判断是否通过。

---

## 安全与脱敏

### 脱敏规则

EnvGuard **默认开启脱敏**，规则如下：

| 条件 | 脱敏结果 |
|------|----------|
| key 名含 PASSWORD / SECRET / TOKEN / API_KEY / PRIVATE 等 | `****` |
| 值长度 ≤ 4 | `****` |
| 值长度 > 4 | 保留首尾各 2 字符，如 `sk***yz` |

### 注意事项

- **`--no-redact` 会输出明文**，仅在本地可信环境使用
- 密钥检测基于**启发式规则**，可能有误报或漏报
- **不要把真实密钥提交到 Git**，`.env.example` 应使用占位符
- EnvGuard 是辅助工具，不能替代专业的密钥扫描服务

---

## 常见问题

### Q: 支持 `.env.local` 或加密 env 吗？

第一版暂不支持 dotenv-vault 等加密格式，仅支持标准 `KEY=VALUE` 文本格式。

### Q: 为什么同一个 key 出现多条告警？

一个变量可能同时命中多条规则，例如 `GITHUB_TOKEN` 既匹配敏感 key 名，又匹配 GitHub Token 格式。

### Q: 如何减少误报？

对占位符使用明显的假值（如 `replace-me`、`your-key-here`），避免使用类似真实密钥的长随机字符串。

### Q: 能在 Windows 上用吗？

可以。项目使用 Node.js，支持 Windows / macOS / Linux。

### Q: 如何参与开发？

```bash
git clone https://github.com/wanghaofu124/envguard-cli.git
cd envguard-cli
npm install
npm test
npm run build
```

---

## 相关链接

- 仓库：https://github.com/wanghaofu124/envguard-cli
- 问题反馈：https://github.com/wanghaofu124/envguard-cli/issues
