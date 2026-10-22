---
name: devops-ci-cd
description: Continuous integration and deployment standards for Next.js, FastAPI, Docker containers, and Windows Tauri installer builds.
---

# DevOps & CI/CD Skill

## Pipeline Architecture
1. **Pull Request Validation**:
   - Run linter (`ruff` for Python, `eslint` for TypeScript).
   - Type-checks (`tsc --noEmit`, `mypy`).
   - Automated test suites (`pytest tests/`, Vitest unit tests).
   - Security audit (`bandit`, `pip-audit`, `pnpm audit`).
2. **Windows Desktop Release Workflow**:
   - Built on `windows-latest` GitHub Actions runners.
   - Tauri CLI packaging into standalone `.msi` and `.exe` installers.
   - Automated binary hashing (SHA-256) and artifact upload.
3. **Containerization**:
   - Multi-stage Dockerfile for FastAPI backend with unprivileged user execution.
   - Redis and PostgreSQL orchestration via Docker Compose.
