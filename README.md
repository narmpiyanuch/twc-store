# Insight Taweechai

Responsive POS and production inventory prototype for a drinking-water manufacturer supporting both house-brand and OEM products.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The NestJS API scaffold can be run separately with `npm run dev:api`.

## Deploy the web app to Vercel

The repository includes a root `vercel.json` for this npm-workspaces monorepo.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the repository root as the Root Directory. The committed `vercel.json` builds only the `web` workspace and deploys `apps/web/.next`.
4. Deploy. Future pushes to the production branch will trigger deployments automatically.

The current NestJS app is a separate long-running API service and is not included in the Vercel deployment. Deploy it independently (for example on Railway, Render, Fly.io, or a container platform), then set its URL in the web project's environment variables when API integration is implemented.

## Architecture

- `apps/web`: Next.js App Router responsive operations UI
- `apps/api`: NestJS API scaffold and domain overview
- `docs/product-blueprint.md`: researched feature scope, workflows, and data model
