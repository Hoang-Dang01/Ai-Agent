# 🌳 Cây thư mục rút gọn (Max Depth = 2)

```text
Ai-Agent/
├── .antigravity/
│   ├── agents/
│   │   ├── 01-strategy/
│   │   │   ├── main.mdc
│   │   │   ├── product-manager.mdc
│   │   │   └── system-architect.mdc
│   │   ├── 02-engineering/
│   │   │   ├── ai-engineer.mdc
│   │   │   ├── backend-expert.mdc
│   │   │   ├── frontend-vibe.mdc
│   │   │   └── main.mdc
│   │   ├── 03-security-qa/
│   │   │   ├── main.mdc
│   │   │   ├── security-auditor.mdc
│   │   │   └── test-engineer.mdc
│   │   ├── 04-knowledge/
│   │   │   ├── main.mdc
│   │   │   └── technical-writer.mdc
│   │   └── 05-research-rnd/
│   │       ├── main.mdc
│   │       └── persona-swarm.mdc
│   ├── core/
│   │   ├── 00-anti-hallucination.mdc
│   │   ├── 01-coding-standards.mdc
│   │   ├── 01-ui-glassmorphism.mdc
│   │   ├── 02-defensive-coding.mdc
│   │   ├── 02-ui-glassmorphism.mdc
│   │   ├── 03-git-safety.mdc
│   │   ├── 04-tech-stack-master.mdc
│   │   ├── 05-turing-loop-rl.mdc
│   │   ├── 06-rag-data-pipeline.mdc
│   │   └── 07-deep-learning-integration.mdc
│   ├── project/
│   │   ├── db-schema.md
│   │   ├── project-history.md
│   │   └── spec.md
│   └── templates/
│       ├── audit-report.md
│       ├── srs-template.md
│       └── test-case-template.md
├── .vscode/
│   └── settings.json
├── apps/
│   ├── backend-ai/
│   │   ├── app/
│   │   │   ├── engines/
│   │   │   ├── routers/
│   │   │   └── schemas/
│   │   ├── experiments/
│   │   │   └── dino-cv-bot/
│   │   │       └── dino_async_dqn.py
│   │   └── requirements.txt
│   ├── frontend/
│   │   ├── .next/
│   │   │   ├── dev/
│   │   │   │   ├── build/ (+++)
│   │   │   │   ├── cache/ (+++)
│   │   │   │   ├── logs/ (+++)
│   │   │   │   ├── server/ (+++)
│   │   │   │   ├── static/ (+++)
│   │   │   │   ├── types/ (+++)
│   │   │   │   ├── build-manifest.json
│   │   │   │   ├── fallback-build-manifest.json
│   │   │   │   ├── lock
│   │   │   │   ├── package.json
│   │   │   │   ├── prerender-manifest.json
│   │   │   │   ├── routes-manifest.json
│   │   │   │   └── trace
│   │   │   └── types/
│   │   │       ├── cache-life.d.ts
│   │   │       ├── routes.d.ts
│   │   │       └── validator.ts
│   │   ├── public/
│   │   │   ├── file.svg
│   │   │   ├── globe.svg
│   │   │   ├── next.svg
│   │   │   ├── vercel.svg
│   │   │   └── window.svg
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── favicon.ico
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── dashboard/ (+++)
│   │   │   │   ├── layout/ (+++)
│   │   │   │   └── ui/ (+++)
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   ├── .gitignore
│   │   ├── AGENTS.md
│   │   ├── CLAUDE.md
│   │   ├── components.json
│   │   ├── eslint.config.mjs
│   │   ├── next-env.d.ts
│   │   ├── next.config.ts
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── README.md
│   │   └── tsconfig.json
│   └── orchestrator/
│       ├── agents/
│       │   ├── agent.js
│       │   ├── analytics_expert.md
│       │   └── code_mentor.md
│       ├── core/
│       │   ├── BaseNode.js
│       │   └── WorkflowRunner.js
│       ├── db/
│       │   └── database.js
│       ├── nodes/
│       │   └── ProfessorNode.js
│       ├── public/
│       │   ├── src/
│       │   │   └── CopilotAssistant.js
│       │   ├── index.html
│       │   └── main.js
│       ├── sql/
│       │   └── schema.sql
│       ├── src/
│       │   ├── controllers/
│       │   ├── db/
│       │   └── tools/
│       ├── tools/
│       │   ├── crawler.js
│       │   └── tinh_giam_gia.py
│       ├── package-lock.json
│       ├── package.json
│       ├── server.js
│       └── test_db.js
├── bots/
│   ├── dino-cv-bot/
│   └── minecraft-engine/
│       ├── src/
│       │   ├── FlightController.js
│       │   ├── server.js
│       │   └── VaultManager.js
│       └── package.json
├── docs/
│   ├── history/
│   │   ├── old-updates/
│   │   │   ├── 2026-05-08_migrate_minecraft_legacy.md
│   │   │   ├── 2026-05-08_refactor_masterplan.md
│   │   │   └── update_2026_05_11.md
│   │   ├── CHANGELOG.md
│   │   └── project-history.md
│   ├── plans/
│   │   └── master-plan.md
│   ├── vault/
│   │   ├── lessons-learned/
│   │   ├── persona-library/
│   │   └── tech-stack/
│   │       ├── claude-cli-research/
│   │       │   ├── reports/ (+++)
│   │       │   ├── src/ (+++)
│   │       │   ├── CODEMAP-claude-source.md
│   │       │   └── README.md
│   │       ├── GenerativeAICourse/
│   │       │   ├── content/ (+++)
│   │       │   ├── .gitignore
│   │       │   └── README.md
│   │       ├── turing-hub/
│   │       │   ├── architecture/ (+++)
│   │       │   ├── experiments/ (+++)
│   │       │   ├── integrations/ (+++)
│   │       │   └── vector_knowledge/ (+++)
│   │       ├── agency-agents-overview.md
│   │       └── ui-vibe-stack.md
│   ├── BRD.md
│   ├── brief.md
│   ├── directory-tree-simplified.md
│   └── README.md
├── integrations/
│   ├── auth/
│   ├── automation/
│   └── payments/
├── scripts/
│   ├── devops/
│   │   ├── build.ps1
│   │   ├── deploy-prod.sh
│   │   └── setup_blueprint.ps1
│   ├── docker-legacy/
│   │   ├── clear_cache.bat
│   │   ├── restart.bat
│   │   ├── start-dev.bat
│   │   ├── start.bat
│   │   └── stop.bat
│   └── docs-utils/
│       ├── auto_translate_docs.py
│       ├── extract_agents.js
│       ├── extract-knowledge.py
│       ├── gen_tree_simplified.js
│       ├── gen_tree.js
│       └── watch_tree.js
├── .gitignore
├── AGENTS.md
├── docker-compose.yml
├── package-lock.json
├── package.json
└── README.md
```

> **Chú thích**: Các thư mục có dấu `(+++)` bên trong còn chứa nhiều file/thư mục con khác nhưng đã được ẩn đi để dễ nhìn.
