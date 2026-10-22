---
name: devsecops-release-engineering
description: Standards for DevSecOps, secret scanning, dependency vulnerability audits, SBOM generation, and authenticated Windows installer releases.
---

# DevSecOps & Release Engineering Skill

## Pipeline Safeguards
1. **Secrets Sanitization**:
   - Zero hardcoded secrets, API tokens, or private keys committed to version control.
   - Run automated secret scanning (`gitleaks`, `detect-secrets`) on every pull request.
2. **Dependency Supply Chain**:
   - Automated dependency vulnerability checks: `pip-audit`, `pnpm audit`.
   - Lockfile enforcement in CI: `pnpm install --frozen-lockfile`.
3. **Artifact Integrity**:
   - Compute SHA-256 checksums for all production binaries and Windows `.exe` installers.
   - Code-sign Windows installers with Authenticode certificates via GitHub Actions Windows runners.
4. **Environment Isolation**:
   - Strict separation between Development, Staging, and Production environments.
   - Production database credentials must never be shared with development agents.
