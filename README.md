# EnvGuard CLI

Secure `.env` diff tool with redaction and secret detection.

EnvGuard helps you compare environment files safely: differences are categorized, values are redacted by default, and common secret patterns are flagged before they leak into logs or pull requests.

## Features

- Compare two `.env` files: added, removed, changed, unchanged
- Redact sensitive values by default
- Detect common secret patterns (OpenAI, GitHub, AWS, JWT, high-entropy strings)
- Interactive TUI mode for quick local checks
- JSON output for CI and scripting

## Quick Start

```bash
git clone https://github.com/wanghaofu124/envguard-cli.git
cd envguard-cli
npm install
npm run build
```

Run locally:

```bash
node bin/envguard.js diff fixtures/.env.example fixtures/.env.prod
node bin/envguard.js check fixtures/.env.prod
node bin/envguard.js
```

## Usage

### Interactive TUI

```bash
envguard
```

You'll be prompted for two file paths, then browse the diff with:

- `Tab` — switch view (differences / all / secrets)
- `q` — quit

### Diff two files

```bash
envguard diff .env.example .env
envguard diff .env.example .env --all
envguard diff .env.example .env --format json
```

### Scan one file

```bash
envguard check .env
envguard check .env --strict
envguard check .env --format json
```

## Options

| Command | Option | Description |
|---------|--------|-------------|
| `diff` | `--format text\|json` | Output format (default: `text`) |
| `diff` | `--all` | Include unchanged entries |
| `diff` | `--no-redact` | Show raw values (**unsafe**) |
| `check` | `--format text\|json` | Output format (default: `text`) |
| `check` | `--strict` | Exit code 1 on any finding |
| `check` | `--no-redact` | Show raw values (**unsafe**) |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success, no high-severity secrets |
| `1` | High-severity secret detected, or `--strict` finding |
| `2` | File read/parse error |

## Security Notes

- Redaction is enabled by default. Use `--no-redact` only in trusted environments.
- Secret detection uses heuristics and may produce false positives or miss custom formats.
- Do not commit real secrets to Git. Use `.env.example` with placeholder values.

## Development

```bash
npm install
npm test
npm run build
npm run typecheck
```

## License

MIT

---

# EnvGuard CLI（中文）

EnvGuard 是一个安全的 `.env` 文件对比工具，默认脱敏输出，并检测常见密钥泄露模式。

## 功能

- 对比两个 `.env` 文件的差异（新增 / 删除 / 修改 / 未变更）
- 默认脱敏显示敏感值
- 检测 OpenAI、GitHub、AWS、JWT 等常见密钥格式
- 支持交互式 TUI 和 JSON 输出（适合 CI）

## 快速开始

```bash
git clone https://github.com/wanghaofu124/envguard-cli.git
cd envguard-cli
npm install
npm run build
node bin/envguard.js diff fixtures/.env.example fixtures/.env.dev
```

## 命令示例

```bash
# 交互模式
envguard

# 对比
envguard diff .env.example .env

# 扫描
envguard check .env --strict
```

## 安全说明

- 默认开启脱敏，`--no-redact` 会暴露明文，请谨慎使用
- 密钥检测基于规则启发式，可能有误报或漏报

## 许可证

MIT
