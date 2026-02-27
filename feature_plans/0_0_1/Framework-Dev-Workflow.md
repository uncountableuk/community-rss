# **Local Development Workflow for the Framework**

> **⚠️ SUPERSEDED** — This document was written for the initial 0.0.1 design
> when the playground was version-controlled. As of 0.4.0, the playground is
> ephemeral (gitignored) and rebuilt via `npm run reset:playground`. See
> `.github/copilot-instructions.md` and `docs/src/content/docs/contributing/setup.md`
> for the current dev workflow.

--- get a "hot view" of your framework while developing it, you will use **NPM Workspaces**. This allows you to create a "Playground" Astro app right next to your framework code. NPM will automatically symlink them together, so the Playground app treats your local framework code exactly as if it were downloaded from NPM.

Because Astro uses Vite under the hood, any changes you make to the framework's .astro or .ts files will instantly trigger a Hot Module Replacement (HMR) update in the browser running the Playground app.

## **1\. Directory Structure**

Your Git repository (which opens inside your Dev Container) should be structured like a Monorepo:

/community-rss-monorepo (Root)  
├── package.json           \<-- Root package defining the workspaces  
├── packages/  
│   └── core/              \<-- THIS IS YOUR NPM PACKAGE (@community-rss/core)  
│       ├── package.json   (Name: "@community-rss/core")  
│       ├── index.ts       (Exports the integration)  
│       └── src/           (Your framework components, routes, and logic)  
│  
└── playground/            \<-- THIS IS YOUR "HOT VIEW" (A standard Astro app)  
    ├── package.json       (Depends on "@community-rss/core": "\*")  
    ├── astro.config.mjs   (Imports the core integration)  
    └── src/               (Minimal setup to test the default scaffolding)

## **2\. Configuration Files**

### **The Root package.json**

At the very top level of your project, you define the workspaces.

{  
  "name": "community-rss-monorepo",  
  "private": true,  
  "workspaces": \[  
    "packages/\*",  
    "playground"  
  \]  
}

### **The Playground package.json**

Inside the playground/ directory, you add your core package as a dependency. Because of the workspaces setup, NPM knows to link this locally rather than looking on the internet.

{  
  "name": "playground-app",  
  "version": "1.0.0",  
  "scripts": {  
    "dev": "astro dev"  
  },  
  "dependencies": {  
    "astro": "^4.0.0",  
    "@community-rss/core": "\*"  
  }  
}

### **The Playground astro.config.mjs**

Inside the playground/ directory, you consume your framework just like a user would.

import { defineConfig } from 'astro/config';  
import communityRss from '@community-rss/core';

export default defineConfig({  
  integrations: \[  
    communityRss({  
      // Pass your test configuration here  
      theme: 'default',  
      maxFeeds: 5  
    })  
  \]  
});

## **3\. How to Develop Interactively**

1. Open your Dev Container to the root /community-rss-monorepo.  
2. Run npm install at the root. NPM will wire up the symlinks automatically.  
3. Open a terminal, navigate to the playground: cd playground  
4. Start the dev server: npm run dev  
5. Open your browser to http://localhost:4321.

Now, if you go into packages/core/src/components/FeedCard.astro and change the background color of a card, the browser at localhost:4321 will update instantly.

## **4\. Version Control (Git)**

**Yes, the playground/ directory SHOULD be in version control\!** You do not want to .gitignore it. The playground serves three vital purposes for your open-source repo:

1. It is your primary development testing environment.  
2. It acts as the "Reference Implementation" showing the default state of the framework.  
3. It serves as the live example for your documentation (you can deploy the playground/ folder to a Cloudflare Pages preview environment to show people what the framework looks like out-of-the-box).

When you are ready to release, you only run npm publish from inside the packages/core/ directory. The playground stays safely in your GitHub repo.