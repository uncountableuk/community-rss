# **Discussion Paper: Progressive Customization & The Shadow Architecture**

**To:** Development Team

**From:** Project Lead / Architecture

**Date:** February 2026

**Subject:** Moving from "Upfront Scaffolding" to "Progressive Customization" in the Community RSS Framework

## **1\. Executive Summary**

With the successful rollout of v0.5.0, our framework now boasts a robust separation of concerns via three-tier CSS tokens, Astro Actions, and Proxy Components. However, the current init command scaffolds a large number of files (pages, components, and templates) directly into the developer's repository.

While this gives developers immediate control, it introduces **scaffold drift**. When we release bug fixes or new features for default pages (like the Profile or Homepage), developers who haven't customized those files miss out on the updates unless they manually reconcile their files.

To maximize upgradeability and minimize boilerplate, we need to transition to a **Progressive Customization (Shadowing)** model. In this model, the reference application is provided entirely by the framework by default. Developers only "eject" or "shadow" specific files into their repository when they actively need to change them.

This paper outlines a 4-level customization hierarchy and proposes technical implementations to achieve this with minimal friction.

## **2\. The Progressive Customization Hierarchy**

We will formalize customization into four distinct levels of increasing complexity and "upgrade risk."

### **Level 1: Styling & CSS (Lowest Risk, Default Interaction)**

* **Mechanism:** CSS Custom Properties (theme.css).  
* **Implementation:** The init command provides a blank theme.css with commented-out examples of our 3-tier design tokens.  
* **Impact:** Developers can completely re-skin the application (colors, fonts, spacing) without touching a single Astro component. Framework updates flow seamlessly.

### **Level 2: Page Layouts (Low Risk)**

* **Mechanism:** Shadowing specific pages.  
* **Implementation:** By default, the framework injects all pages (e.g., /profile, /, /auth/signin). If a developer wants to add a new section to the profile, they run a command to copy Profile.astro into their local src/pages/ directory.  
* **Impact:** The developer now owns the layout of that specific page, but the rest of the application continues to update automatically.

### **Level 3: Components (Medium Risk)**

* **Mechanism:** Shadowing specific components.  
* **Implementation:** If a developer wants to change the internal HTML structure of a FeedCard, they pull it into src/components/.  
* **Constraint:** Because default framework pages import *framework* components, a developer must usually shadow a Page to point it to their newly shadowed Component. (We accept this limitation as it keeps the mental model simple).

### **Level 4: API & User Flow (High Risk / Bespoke)**

* **Mechanism:** Custom API routes and overriding Astro Actions.  
* **Implementation:** Developers write their own endpoints or bypass framework middleware.  
* **Impact:** This is the "eject" threshold. The application becomes bespoke. The framework no longer guarantees seamless updates for these flows. The DX should include explicit warnings when developers take this path.

## **3\. Proposed Developer Experience (DX) Solutions**

How do we make this easy for the developer? We have a few options to facilitate this "shadowing" process.

### **Idea A: The "Signpost" Directory Scaffold (Suggested Approach)**

As proposed, the init command scaffolds the *directory structure* but leaves the directories mostly empty, populated only by README.md files.

* **Structure created on init:**  
  /src  
    /pages  
      README.md  
    /components  
      README.md  
    theme.css

* **The README Content:** The README acts as a signpost.  
  * *"Want to customize a page? The framework serves default pages automatically. To override them, run npx @community-rss/core eject pages/profile. This will place the file here."*  
* **Pros:** Excellent discoverability. Developers looking for where pages live are immediately greeted with instructions on how the framework operates.  
* **Cons:** Slightly litters the repo with READMEs, though these can be ignored in .gitignore or deleted by the developer.

### **Idea B: The CLI eject / shadow Command**

We introduce a CLI helper to handle the actual copying of files.

* **Command:** npx @community-rss/core shadow \<target\> (e.g., npx crss shadow pages/index)  
* **Under the hood:**  
  1. Locates the requested file in node\_modules/@community-rss/core/src/...  
  2. Copies it to the developer's local src/ equivalent.  
  3. **Crucial Step:** Automatically rewrites internal relative imports to point to the package public exports. (e.g., import FeedCard from '../components/FeedCard.astro' becomes import FeedCard from '@community-rss/core/components/FeedCard.astro').  
* **Pros:** Eliminates the copy/paste error margin. Automatically fixes import paths.

### **Recommendation: Combine A and B**

We should implement both. The README.md files provide the "just-in-time" documentation when a developer is exploring the codebase, and the CLI tool provides the safe, automated mechanism to execute the override.

## **4\. Technical Implementation: Conditional Route Injection**

To make Level 2 (Page Shadowing) work, the core framework must be smart enough to yield to user files.

Currently, Astro's router naturally prioritizes physical files in src/pages/ over injected routes. However, to prevent route collision warnings and optimize builds, our integration's astro:config:setup hook should programmatically check for user overrides before injecting.

**Proposed Integration Logic:**

import fs from 'node:fs';

export default function communityRssIntegration(options) {  
  return {  
    name: '@community-rss/core',  
    hooks: {  
      'astro:config:setup': ({ injectRoute, config }) \=\> {  
          
        // Define our default routes  
        const frameworkRoutes \= \[  
          { pattern: '/', entrypoint: 'pages/index.astro', localPath: 'src/pages/index.astro' },  
          { pattern: '/profile', entrypoint: 'pages/profile.astro', localPath: 'src/pages/profile.astro' },  
          // ...  
        \];

        // Only inject if the user hasn't created a shadow file  
        frameworkRoutes.forEach(route \=\> {  
          const userFileUrl \= new URL(\`./${route.localPath}\`, config.root);  
          if (\!fs.existsSync(userFileUrl)) {  
            injectRoute({  
              pattern: route.pattern,  
              entrypoint: \`@community-rss/core/${route.entrypoint}\`  
            });  
          }  
        });  
      }  
    }  
  };  
}

This guarantees that the moment a developer runs npx crss shadow pages/profile, they take over rendering for /profile, seamlessly dropping the framework's default implementation.

## **5\. Next Steps for the Development Team**

To achieve this architecture, please review and schedule the following tasks:

1. **Invert the Routing Model:** Update src/integration.ts to implement conditional injectRoute for all user-facing pages (Home, Profile, Auth, etc.).  
2. **Update the CLI init Command:** \* Stop scaffolding .astro files by default.  
   * Scaffold the blank theme.css.  
   * Scaffold empty src/pages/ and src/components/ directories containing instructional README.md files.  
3. **Build the CLI shadow Command:** \* Create a script that copies package files to local directories.  
   * Include simple Regex/AST logic to update relative internal imports to @community-rss/core/... package aliases.  
4. **Define the Level 4 Boundary:** Ensure our documentation clearly defines the "eject threshold." If a developer overrides API routes or Action handlers, they are taking ownership of that data flow and assume responsibility for future breaking changes.

## **Conclusion**

By shifting to a Progressive Customization model, we drastically reduce the boilerplate dumped into a new project. A new Community RSS deployment will literally consist of an astro.config.mjs, a .env, and a theme.css.

Developers get a fully functional, auto-updating application out of the box, with a clear, well-documented, and safe pathway to modify exactly what they need—and nothing more.