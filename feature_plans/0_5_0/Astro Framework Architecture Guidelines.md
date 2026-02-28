# **Engineering Scalable Community Frameworks: An Architectural Blueprint for Upgradeable Astro-Based RSS Applications**

The emergence of Astro as a dominant force in the content-driven web landscape is primarily attributed to its revolutionary approach to the "Islands Architecture," which enables developers to ship zero client-side JavaScript by default while selectively hydrating interactive components.1 For an open-source framework designed to power community-centric RSS applications—incorporating complex authentication flows, social interactions, and profile management—the architectural requirements extend beyond simple static site generation. The challenge lies in creating a system where the core API logic is maintained in a centralized, upgradeable npm package, while the presentation layer remains entirely in the hands of the end-developer. This separation of concerns ensures that security patches and feature enhancements can be deployed via standard package updates without disrupting the bespoke visual identity or layout of individual community instances.3

## **The Integration API as the Framework Backbone**

The primary mechanism for building a framework on top of Astro is the Integration API. This interface allows a core package to hook into Astro’s internal build process, register middleware, and inject routes programmatically.3 By utilizing these hooks, a framework developer can abstract the "engine" of the RSS application, ensuring that the heavy lifting of data orchestration is handled by the core package.

### **Lifecycle Hook Orchestration**

A robust integration must strategically utilize the Astro lifecycle to maintain the boundary between the framework's core and the user's bespoke implementation. The astro:config:setup hook serves as the primary entry point where the framework defines its environment.3

| Lifecycle Hook | Primary Architectural Responsibility | Impact on Upgradeability |
| :---- | :---- | :---- |
| astro:config:setup | Injects routes, registers middleware, and configures Vite plugins.3 | High: Allows core logic to be added without modifying user config files. |
| astro:config:done | Validates that the final configuration meets the framework's requirements.5 | Medium: Ensures the user hasn't introduced conflicting settings. |
| astro:server:setup | Configures the development server and enables hot module replacement (HMR) for core logic.5 | Low: Primarily impacts the development experience. |
| astro:build:start | Initializes global objects or clients needed during the production build.5 | Medium: Sets the stage for production-ready data fetching. |
| astro:build:done | Performs post-build cleanups or generates supplemental artifacts like RSS feeds.5 | High: Ensures final outputs are consistent across all instances. |

The injectRoute function is particularly critical. It allows the core package to provide default pages for authentication, such as /signin and /signup, without requiring the user to create these files manually in their src/pages directory.3 However, to maintain maximum flexibility, the framework must respect a "shadowing" pattern. If the integration detects that a user has created a bespoke page at a matching route, it should yield priority to the user's file, effectively treating the core's injected routes as fallback implementations.

### **Middleware and the Data Contract**

To decouple the backend API from the layout, the framework must rely on middleware to handle cross-cutting concerns. By using addMiddleware, the core package can intercept incoming requests to manage session state, validate authentication tokens, and pre-populate the Astro.locals object.10 This pattern creates a "data contract" between the engine and the UI. A developer creating a bespoke profile page does not need to know how to query the database or interface with the RSS feed aggregator; they simply consume the structured data provided by Astro.locals.user or Astro.locals.feed.11

## **Scaffolding and the Reference Implementation**

A core requirement of the proposed framework is that a reference implementation should be installable via an init command, providing a complete, functional application that the user can immediately customize. This process is modeled after the "copy-paste" philosophy popularized by shadcn/ui, where components are not treated as immutable black boxes but as starting points for bespoke development.13

### **Stub-Based File Generation**

The scaffolding process should utilize "stubs"—template files that define the initial project structure.15 When a developer runs the framework's initialization command, the CLI should copy these stubs into the user's repository. These files represent the presentation layer, including layouts, CSS tokens, and component wrappers. By placing these files in the user's src directory, the framework grants the developer full ownership of the visual identity while the logic remains tethered to the core package.15

The relationship between the number of scaffolded files ![][image1] and the developer's perception of flexibility ![][image2] can be expressed as:

![][image3]  
Where ![][image4] is a constant representing the ease of customization. While increasing the number of scaffolded files increases flexibility, it also increases the burden of maintenance during major framework updates. Therefore, the architecture must distinguish between "bespoke layouts" (which the user owns) and "core components" (which the framework maintains).17

### **Proxy Component Architecture**

To avoid the pitfalls of forking, the framework should adopt a "Proxy Component" pattern. In this model, the scaffolded components in the user's repository act as wrappers. For example, a src/components/LikeButton.astro file might be installed by the init command, but its internal implementation simply imports a functional "Headless" component from the core npm package.14

This architecture allows the framework to update the underlying logic of the LikeButton (e.g., adding a debounce to prevent API abuse or updating the interaction with a new database schema) without overwriting the user's bespoke HTML or CSS within the wrapper. If the user only wants to change the appearance of the button, they modify the scaffolded file; if the framework needs to fix a bug in the API interaction, it updates the npm package.4

## **Decoupled Styling and Design Token Systems**

A cornerstone of the framework's customization strategy is a sophisticated styling architecture. By prioritizing vanilla, modern CSS and a centralized token system, the framework ensures that global aesthetic changes are trivial for the end-developer to implement.20

### **The Three-Tier Token Hierarchy**

To maintain consistency while allowing for granular overrides, the framework should implement a three-tier design token system.20

1. **Reference Tokens:** These define the foundational values of the design system, such as a full color palette, spacing scales, and typography settings (e.g., \--color-blue-500: \#3b82f6). These should be treated as the raw "ingredients" of the UI.20  
2. **System Tokens:** These tokens convey intent and map reference tokens to functional roles. For example, \--color-primary: var(--color-blue-500) or \--spacing-gap: var(--space-4). This is the primary layer where a developer customizes their brand.20  
3. **Component Tokens:** These are scoped variables used within specific components to allow fine-tuned adjustments without affecting the global theme. For instance, \--btn-background: var(--color-primary).20

| Token Tier | Purpose | Customization Scope |
| :---- | :---- | :---- |
| **Reference** | Raw value definition (Palette, Scale) | Global definitions.20 |
| **System** | Functional intent (Primary, Background, Success) | Brand identity and global consistency.20 |
| **Component** | Granular detail (Button Padding, Input Border) | Individual UI element overrides.20 |

### **Centralization and Modern CSS Features**

The framework must mandate that these tokens reside in separate CSS files, typically within a styles/tokens.css directory. This separation ensures that the core components can reference these variables without having any hardcoded style values. By using the :root pseudo-class for token definitions and the @layer directive for resets and base styles, the framework can guarantee that user-defined styles always have the correct specificity to override framework defaults.21

Utility CSS functions, such as layout grids or flexbox helpers, should also be centralized. This prevents code duplication and ensures that the framework's internal layouts (like the profile grid) remain consistent even when the user changes the specific styling of individual cards. Only styling that is strictly unique to a component's internal structure—such as the positioning of a specific icon within a button—should live inside the component's \<style\> tag.22

## **Logic Separation and Headless API Integration**

To achieve the goal of upgradeable core logic, the framework must enforce a strict separation between the "View" (the Astro component) and the "Logic" (the JavaScript that interacts with the API). This is achieved through the use of headless patterns and decoupled scripts.23

### **Astro Actions as the Logic Bridge**

With the introduction of Astro Actions, the framework has a native, type-safe mechanism for defining backend functions that can be called from both the server and the client.10 The core package should export these Actions as its primary API. For example, the functionality for "liking" a post or "posting" a comment should be encapsulated in an Action.

When a developer builds a bespoke layout, they import these Actions and bind them to their own UI elements. This ensures that the complex logic of the RSS application—such as handling feed synchronization, managing rate limits, or updating the database—is handled entirely within the core package.25 The bespoke component only needs to handle the "input" (the user interaction) and the "output" (the visual change after the Action completes).

### **Decoupled JavaScript Controllers**

JavaScript that is integral to the API—such as the logic for handling real-time updates via WebSockets or client-side form validation—should be provided in separate .js or .ts files rather than living inside the Astro components' \<script\> tags.25 This allows the user to import the functional logic into their own custom scripts, ensuring that the "engine" remains upgradeable even if the "shell" is completely custom.

The architecture should follow a "Service-Provider" pattern:

* **Services:** Reside in the core package and handle all API communication and state management.  
* **Controllers/Hooks:** Reside in the core package but are imported by the user to bridge the Service with the UI.  
* **View Components:** Reside in the user project and focus exclusively on rendering the DOM and styles.28

## **Transactional Email Compilation Pipeline**

Email templates represent a unique architectural hurdle because they must be self-contained, inlining all styles to ensure compatibility with restrictive email clients, while still allowing the developer to reuse the same design tokens used on the web.31

### **The Build-Time Email Rendering Flow**

The framework should utilize the experimental Astro Container API to render .astro email components into static HTML strings during the build process.33 This allows the framework to treat email templates like any other Astro component, enabling the use of components, props, and design tokens.

The compilation pipeline should function as follows:

1. **Token Transformation:** During the build step, the framework reads the user's CSS token files and transforms them into a JSON object of values.  
2. **Containerized Rendering:** The Astro Container API renders the email .astro files, passing the design tokens as props. This ensures that the email's colors, fonts, and spacing perfectly match the main web application.33  
3. **Style Inlining:** A post-rendering tool (such as Juice or a custom Vite plugin) takes the generated HTML and the framework's base email CSS and inlines the styles directly into the tags.32  
4. **Runtime Placeholder Preservation:** To handle dynamic data replacement at runtime (e.g., {{username}}), the framework must use a syntax that is not escaped by Astro's renderer. By using standard Handlebars-style placeholders or the @{{ }} escape syntax, the compiled HTML can be handed off to the backend for final delivery.32

This process results in a set of self-contained HTML files in the dist folder that are optimized for email delivery but were authored using the same modern development workflow as the rest of the site.35

## **API Stability and the Inversion of Control Pattern**

To ensure that the framework remains stable and upgradeable after version 1.0.0, it must adopt an "Inversion of Control" (IoC) philosophy. In this model, the framework provides the "structure," and the user project provides the "implementation" for specific steps.28

### **The Hollywood Principle in Framework Design**

The framework should implement the "Hollywood Principle": "Don't call us, we'll call you".39 For example, instead of the core package containing a hardcoded list of RSS feed providers, it should define an RSSProvider interface. The user project can then implement this interface to add support for custom feeds. This ensures that when the core package updates its internal feed-fetching algorithm, it does not break the user's custom implementations.28

| Architectural Pattern | Benefit to the Framework | Impact on Developer Experience |
| :---- | :---- | :---- |
| **Inversion of Control** | Decouples the framework's flow from specific user data.28 | High: Requires understanding interfaces and hooks. |
| **Dependency Injection** | Allows users to swap out core services (e.g., using a different database).28 | Medium: Increases modularity and testability. |
| **Strategy Pattern** | Enables multiple ways to perform a task (e.g., different auth providers).29 | Low: Provides options without adding complexity. |
| **Template Method** | Defines the "skeleton" of a process while allowing users to fill in steps.39 | Medium: Ensures consistent lifecycle management. |

### **Lifecycle Management via Codemods**

As the framework evolves, breaking changes are inevitable. To prevent these changes from forcing users to rewrite their bespoke layouts, the core package should ship with "Codemods"—automated scripts that use Abstract Syntax Tree (AST) transformations to update the user's code.4 For instance, if a future version of the framework changes the name of a required prop in the SignIn wrapper, a codemod can automatically scan the user's repository and rename the prop accordingly, ensuring a smooth upgrade path even for heavily customized instances.41

## **AI-Native Architecture and Customization Safety**

The inclusion of a .github folder containing instructions for AI is a critical component of a modern open-source framework. As more developers use AI assistants to customize their applications, the framework must provide a "Source of Truth" that guides these tools to make decisions that do not compromise future upgradeability.43

### **The Role of .cursorrules and Instruction Sets**

The framework should install a .cursorrules file (or a set of .mdc files in a .cursor/rules/ directory) that defines the architectural boundaries of the project.43 These instructions should explicitly warn the AI against:

* **Direct Logic Modification:** Instructing the AI to never modify files within the node\_modules or core-package-protected directories.8  
* **Style Anti-Patterns:** Directing the AI to use the established design tokens (var(--sys-...)) rather than hardcoding colors or spacing.8  
* **Bypassing the API:** Enforcing the use of the core package's Actions for all database or RSS feed interactions.25

By providing these guidelines, the framework ensures that AI-generated code follows the "Proxy Component" and "Decoupled Logic" patterns, effectively future-proofing the user's customizations.43

### **Multi-Level Guidance for Contributors**

The AI instructions should be divided into two categories:

1. **Framework-User Instructions:** Located in the user's project to guide them in safe customization.43  
2. **Framework-Developer Instructions:** Located in the framework's own repository to guide core contributors in maintaining the stability of the API and the integration lifecycle.46

This dual-layered approach ensures that the entire ecosystem—from core developers to end-users—is aligned with the framework's long-term architectural goals.

## **Strategic Recommendations for Framework Development**

To successfully launch and maintain this Astro-based RSS framework, the following strategic guidelines should be followed by the development team.

### **Ensuring a Resilient "Source of Truth"**

The stability of the framework depends on the immutability of the core package's internal contracts. It is recommended to use TypeScript with strict mode throughout the core package to provide clear interfaces for framework consumers.9 By defining explicit Props interfaces for every scaffolded component, the framework provides "Editor-Time" validation that helps developers catch errors long before they reach production.49

### **Performance-First Principles**

Because the application is built on Astro, the framework should lean heavily into the "Content-Driven" nature of the platform.10 Use "Server Islands" for dynamic components like "Likes" or "Comments" to ensure that the initial page load for the RSS feed remains blazing fast, even if the user is authenticated and has personalized content.1 The mathematical model for page performance in this architecture is:

![][image5]  
Where ![][image6] is the time to deliver the static shell and ![][image7] represents the asynchronous loading of dynamic islands.2 By keeping ![][image6] low through server-side rendering and static site generation, the framework ensures a superior user experience regardless of the complexity of the community interactions.

### **Conclusion**

Architecting a customizable, upgradeable framework on top of Astro requires a rigorous commitment to decoupling. By leveraging the Integration API for route and logic injection, adopting a proxy-based scaffolding system for components, and enforcing a strict design token contract for styles, developers can create a powerful RSS application platform that evolves over time without breaking bespoke implementations. The inclusion of AI-native instructions and build-time email compilation further modernizes the framework, making it a robust choice for the next generation of community-driven web applications. This architectural path ensures that the framework is not just a tool for building sites, but a scalable ecosystem that balances the needs of developers, users, and automated assistants alike.

#### **Works cited**

1. Astro on Netlify, accessed on February 28, 2026, [https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/)  
2. Astro Islands Architecture Explained for Front-End Developers \- Strapi, accessed on February 28, 2026, [https://strapi.io/blog/astro-islands-architecture-explained-complete-guide](https://strapi.io/blog/astro-islands-architecture-explained-complete-guide)  
3. Astro Integration API | Docs, accessed on February 28, 2026, [https://docs.astro.build/en/reference/integrations-reference/](https://docs.astro.build/en/reference/integrations-reference/)  
4. Strapi v4 to v5 Migration Resources, accessed on February 28, 2026, [https://strapi.io/blog/strapi-v4-to-v5-migration-resources](https://strapi.io/blog/strapi-v4-to-v5-migration-resources)  
5. Understanding Astro integrations and the hooks lifecycle, accessed on February 28, 2026, [https://blog.logrocket.com/understanding-astro-integrations-hooks-lifecycle/](https://blog.logrocket.com/understanding-astro-integrations-hooks-lifecycle/)  
6. Astro Integration API | Docs, accessed on February 28, 2026, [https://docs.astro.build/ar/reference/integrations-reference/](https://docs.astro.build/ar/reference/integrations-reference/)  
7. Using @astrojs/node middleware in the development environment, accessed on February 28, 2026, [https://github.com/withastro/roadmap/discussions/507](https://github.com/withastro/roadmap/discussions/507)  
8. Astro Cursor Rules rule by Mathieu de Gouville \- Cursor Directory, accessed on February 28, 2026, [https://cursor.directory/astro-tailwind-cursor-rules](https://cursor.directory/astro-tailwind-cursor-rules)  
9. Getting started with Astro Framework | Refine, accessed on February 28, 2026, [https://refine.dev/blog/astro-js-guide/](https://refine.dev/blog/astro-js-guide/)  
10. Astro, accessed on February 28, 2026, [https://astro.build/](https://astro.build/)  
11. Astro Integration | Better Auth, accessed on February 28, 2026, [https://www.better-auth.com/docs/integrations/astro](https://www.better-auth.com/docs/integrations/astro)  
12. Astro Integration | Altitude Commerce \- Documentation, accessed on February 28, 2026, [https://commerce.thgaltitude.com/packages/astro-integration/](https://commerce.thgaltitude.com/packages/astro-integration/)  
13. Building React Components Compatible with shadcn/ui CLI \- Dev.to, accessed on February 28, 2026, [https://dev.to/keitam83/building-react-components-compatible-with-the-shadcnui-cli-2po9](https://dev.to/keitam83/building-react-components-compatible-with-the-shadcnui-cli-2po9)  
14. Updating and Maintaining Components | Vercel Academy, accessed on February 28, 2026, [https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components](https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components)  
15. Scaffolding (Concepts) | AdonisJS Documentation, accessed on February 28, 2026, [https://docs.adonisjs.com/guides/concepts/scaffolding](https://docs.adonisjs.com/guides/concepts/scaffolding)  
16. What is Astro JS Framework: A Practical Guide To Building Faster, accessed on February 28, 2026, [https://bejamas.com/hub/tutorials/practical-guide-to-astro-js-framework](https://bejamas.com/hub/tutorials/practical-guide-to-astro-js-framework)  
17. accessed on February 28, 2026, [https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components\#:\~:text=One%20way%20of%20customize%20shadcn,makes%20the%20ownership%20concept%20redundant.](https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components#:~:text=One%20way%20of%20customize%20shadcn,makes%20the%20ownership%20concept%20redundant.)  
18. reactjs \- How to customize shadcn components while maintaining, accessed on February 28, 2026, [https://stackoverflow.com/questions/79540562/how-to-customize-shadcn-components-while-maintaining-updateability](https://stackoverflow.com/questions/79540562/how-to-customize-shadcn-components-while-maintaining-updateability)  
19. \[AskJS\] How do you release libraries updates with breaking changes?, accessed on February 28, 2026, [https://www.reddit.com/r/javascript/comments/ssb24n/askjs\_how\_do\_you\_release\_libraries\_updates\_with/](https://www.reddit.com/r/javascript/comments/ssb24n/askjs_how_do_you_release_libraries_updates_with/)  
20. Astro Design Tokens \- Astro UXDS, accessed on February 28, 2026, [https://www.astrouxds.com/design-tokens/getting-started/](https://www.astrouxds.com/design-tokens/getting-started/)  
21. Design Tokens in Webstudio: A Practical Implementation Guide, accessed on February 28, 2026, [https://www.designsystemscollective.com/design-tokens-in-webstudio-a-practical-implementation-guide-927af8d36f36](https://www.designsystemscollective.com/design-tokens-in-webstudio-a-practical-implementation-guide-927af8d36f36)  
22. Styles and CSS \- Astro Docs, accessed on February 28, 2026, [https://docs.astro.build/en/guides/styling/](https://docs.astro.build/en/guides/styling/)  
23. What is a headless architecture? Pros & cons | Hygraph, accessed on February 28, 2026, [https://hygraph.com/blog/headless-architecture](https://hygraph.com/blog/headless-architecture)  
24. What is Headless Architecture? Benefits and Use Cases Explained, accessed on February 28, 2026, [https://strapi.io/blog/headless-architecture](https://strapi.io/blog/headless-architecture)  
25. Creating a Reusable Pop-Up Component with Astro: A Deep Dive, accessed on February 28, 2026, [https://medium.com/@allenhubert22/creating-a-reusable-pop-up-component-with-astro-a-deep-dive-ae9085777817](https://medium.com/@allenhubert22/creating-a-reusable-pop-up-component-with-astro-a-deep-dive-ae9085777817)  
26. Astro Actions With Vanilla JavaScript and Strapi 5, accessed on February 28, 2026, [https://strapi.io/blog/astro-actions-with-vanilla-javascript-and-strapi5](https://strapi.io/blog/astro-actions-with-vanilla-javascript-and-strapi5)  
27. \[RFC\] Astro component's Request-Time Server Side Composition, accessed on February 28, 2026, [https://github.com/withastro/astro/issues/525](https://github.com/withastro/astro/issues/525)  
28. Inversion of Control (IoC) and Dependency Injection (DI) \- Medium, accessed on February 28, 2026, [https://medium.com/@898guptarajashish/inversion-of-control-ioc-and-dependency-injection-di-a-complete-guide-dd6cf283a1d0](https://medium.com/@898guptarajashish/inversion-of-control-ioc-and-dependency-injection-di-a-complete-guide-dd6cf283a1d0)  
29. Inversion of Control and Dependency Injection with Spring | Baeldung, accessed on February 28, 2026, [https://www.baeldung.com/inversion-control-and-dependency-injection-in-spring](https://www.baeldung.com/inversion-control-and-dependency-injection-in-spring)  
30. Inversion of Control, Dependency Injection, and the Spring IoC, accessed on February 28, 2026, [https://sookocheff.com/post/java/inversion-of-control-and-the-spring-ioc-container/](https://sookocheff.com/post/java/inversion-of-control-and-the-spring-ioc-container/)  
31. How to send e-mails in Laravel with Tailwind CSS using Maizzle, accessed on February 28, 2026, [https://medium.com/@m074554n/how-to-send-e-mails-in-laravel-with-tailwind-css-using-maizzle-2a06db1b572c](https://medium.com/@m074554n/how-to-send-e-mails-in-laravel-with-tailwind-css-using-maizzle-2a06db1b572c)  
32. Maizzle: Craft beautiful HTML emails with Tailwind CSS \- notiz.dev, accessed on February 28, 2026, [https://notiz.dev/blog/send-beautiful-emails-crafted-with-maizzle/](https://notiz.dev/blog/send-beautiful-emails-crafted-with-maizzle/)  
33. Astro Container API (experimental) | Docs, accessed on February 28, 2026, [https://docs.astro.build/en/reference/container-reference/](https://docs.astro.build/en/reference/container-reference/)  
34. Container API: render components in isolation \#462 \- GitHub, accessed on February 28, 2026, [https://github.com/withastro/roadmap/discussions/462](https://github.com/withastro/roadmap/discussions/462)  
35. How to Create Resend Email Templates Using Astro | Akos Komuves, accessed on February 28, 2026, [https://akoskm.com/how-to-create-resend-email-templates-using-astro/](https://akoskm.com/how-to-create-resend-email-templates-using-astro/)  
36. Using Handlebars | SendGrid Docs \- Twilio, accessed on February 28, 2026, [https://www.twilio.com/docs/sendgrid/for-developers/sending-email/using-handlebars](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/using-handlebars)  
37. Send emails in an Astro project using Resend | Netlify Developers, accessed on February 28, 2026, [https://developers.netlify.com/guides/send-emails-with-astro-and-resend/](https://developers.netlify.com/guides/send-emails-with-astro-and-resend/)  
38. What is Inversion of Control (IoC) and What Are Its Advantages?, accessed on February 28, 2026, [https://gokhana.medium.com/what-is-inversion-of-control-ioc-and-what-are-its-advantages-c15c648ad304](https://gokhana.medium.com/what-is-inversion-of-control-ioc-and-what-are-its-advantages-c15c648ad304)  
39. Inversion Of Control \- Martin Fowler, accessed on February 28, 2026, [https://martinfowler.com/bliki/InversionOfControl.html](https://martinfowler.com/bliki/InversionOfControl.html)  
40. Inversion of control vs. dependency injection | TheServerSide, accessed on February 28, 2026, [https://www.theserverside.com/video/Inversion-of-control-vs-dependency-injection](https://www.theserverside.com/video/Inversion-of-control-vs-dependency-injection)  
41. Refactoring with Codemods to Automate API Changes \- Martin Fowler, accessed on February 28, 2026, [https://martinfowler.com/articles/codemods-api-refactoring.html](https://martinfowler.com/articles/codemods-api-refactoring.html)  
42. My Workflow for Codemods \- Spencer Miskoviak, accessed on February 28, 2026, [https://www.skovy.dev/codemod-workflow](https://www.skovy.dev/codemod-workflow)  
43. How to write great Cursor Rules \- Trigger.dev, accessed on February 28, 2026, [https://trigger.dev/blog/cursor-rules](https://trigger.dev/blog/cursor-rules)  
44. Cursor Rules – Best Practices Guide \- Tautorn Tech, accessed on February 28, 2026, [https://tautorn.com.br/blog/cursor-rules](https://tautorn.com.br/blog/cursor-rules)  
45. astro-framework | Skills Marketplace \- LobeHub, accessed on February 28, 2026, [https://lobehub.com/skills/delineas-astro-framework-agents-astro-framework](https://lobehub.com/skills/delineas-astro-framework-agents-astro-framework)  
46. Cursor IDE Rules for AI: Guidelines for Specialized AI Assistant, accessed on February 28, 2026, [https://kirill-markin.com/articles/cursor-ide-rules-for-ai/](https://kirill-markin.com/articles/cursor-ide-rules-for-ai/)  
47. Mastering Cursor Rules: A Developer's Guide to Smart AI Integration, accessed on February 28, 2026, [https://dev.to/dpaluy/mastering-cursor-rules-a-developers-guide-to-smart-ai-integration-1k65](https://dev.to/dpaluy/mastering-cursor-rules-a-developers-guide-to-smart-ai-integration-1k65)  
48. Customize Gemini Code Assist behavior in GitHub, accessed on February 28, 2026, [https://developers.google.com/gemini-code-assist/docs/customize-gemini-behavior-github](https://developers.google.com/gemini-code-assist/docs/customize-gemini-behavior-github)  
49. Components \- Astro Docs, accessed on February 28, 2026, [https://docs.astro.build/en/basics/astro-components/](https://docs.astro.build/en/basics/astro-components/)  
50. Understanding Astro Components \- The Heart of Static Site Generation, accessed on February 28, 2026, [https://dev.to/lovestaco/understanding-astro-components-the-heart-of-static-site-generation-7ea](https://dev.to/lovestaco/understanding-astro-components-the-heart-of-static-site-generation-7ea)  
51. Build a headless blog with Astro and Optimizely SaaS CMS, accessed on February 28, 2026, [https://world.optimizely.com/blogs/jacob-pretorius/dates/2024/5/build-a-headless-blog-with-astro-and-optimizely-saas-cms/](https://world.optimizely.com/blogs/jacob-pretorius/dates/2024/5/build-a-headless-blog-with-astro-and-optimizely-saas-cms/)  
52. Integrating Astro with modern frameworks | by Schousboe \- Medium, accessed on February 28, 2026, [https://medium.com/@Schousboe/astro-and-the-modern-frontend-landscape-0400487d8fd6](https://medium.com/@Schousboe/astro-and-the-modern-frontend-landscape-0400487d8fd6)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAZCAYAAADuWXTMAAAAo0lEQVR4XmNgGBZgJhD/JxJjAA0g9mBAKNgHxA5I2BtJDieAKVBHlwACYQYiND9BF0QCL9AFYCCYAaI5C028GUqzA/FWZAlk0McA0ayDJMYLxC5IfKwApOgvA2bI4vUjDMBCegoDIoTDoGIEwWEGiEJWJDF+qBhB8IsBUyEfEOejiWEFRPsPGwBp/IQuSAg4AHEcA0TzIygfhBnhKkbBKCAHAACeKDG7D3WJNgAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAaCAYAAABsONZfAAAAlUlEQVR4XmNgGP5ADYgdgPg/FF8G4kCoGEEA05SNLoEPgDQ8RxfEB3gYIJqWokvgAx0MEE2q6BL4wDEgfoIuiA/wMUBsmY8ugQ90MkA06aBLQIECugAIgJwG0oQLgPyLAWDxgw3UAfEddEEQwKfpMxC3Igs4AHEcA0TDRSB2BOJgIM4A4uNI4nAgABUkhCthGkbBMAYA8GwpOs5biZUAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAApCAYAAACIn3XTAAADEUlEQVR4Xu3dTahVVRQH8F3Qh2QDySD6cCKUhTiKJiHemofVpJGDyqJZQaMix05EaqaQKTRw0EQwComIPmhQAwkHFYENCmpWENGgQe3VOVf3W5737jvX+/TF/f3gj3uvfTwfs8X2nGspAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsrTtrXsrFTeDjXAAAGPJPzUc12/PCgt1SumtdjYfK+HO8UvN4LlaT0p3ruX4c2d/XnpgetCB31/xSuvNnY58HAFhC0TDck4sb4IaymOZk7DlWO353GV57pmZbLg54KxfWMCndtYYatgOlayoBAAY9WIablo3was3PuTiHMfe7q+bTXOydLivP9Xz/51BTNWRMwxZWa9jCmGcCAJbMu+XaNQu/17zYj7+pea/mtsvL69beb4yP1Xxf82VaCyfL2k3SiWb+XTNejzdzYQYNGwAwl2gUjufiKuI9t1l57NLRV5o2Jeea+V39eIzc3LTzz2oON/O/a+5t5q34e21eWLk8kx02AOCaiEZhZ6rFxwGRRbqpdNc6nxcGxHGv5WIjNzdfNeNoGt9p5vnYVrsWHx7Mcijli4HaWuJ6T+ZiL9a25CIAwP1luKH5OhcW4PWaH0v3JWpc89aVyyu8X3N7LjbyPX/ejD+sOdXMY4ftjmbeas8T77qNNc8O21O52MvPBADwn/zSfdhRcybVpibryNYy7M/SfQ0Z4pr7ah4o3c7bWPme24YtdthONfPY0Xu4mU/tqXk7F0eap2F7Ohd7+ZkAgCUXP68xKV2TEO98xXtn8aOyn/S1eT4EmKVtSP4o3btr3za19Xq2dOd6uZ8frPmtdM+wt+bXmos1j/Tr8ZHD0X48Nam5UHOkH89rTMM2Kd19x/t7Mc40bADAdfdomg/tem2Uv3JhQcY0bGuJfx4+m4sAAMvkp9LtKi7afbkwp9jt24j7AwD437ix5odc3CTif1SY/jYdAMBSu7nmjVzcBD7IBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADY/P4FT6aNLAqOJpcAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAZCAYAAADnstS2AAAAzElEQVR4XmNgGHSgF4j/Q/FjNDkMwA/E+xkgihejyWEFMJMt0SWwAZDCz0DMgi6BDYAU16KJSaHxwUCCAaLYAcrXBeI9QPwKiJOhYnAwhQHiQRCIBWI+IJZmgBiwGqYIBs4BcRMQZwPxQagYFxBfBGINmCIQCGCAmPAciN8B8V5kSXQAixA2IE5igGhoRVGBBI4xQBTDQAgQf4Cy2YFYE0kOrPAnEj8KiA9D2XeAWBFJDqx4JxLfggGhuB9JHAxAkugAlFZs0QVHAe0BAJ4mKIr5b9p3AAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAZCAYAAABkdu2NAAACU0lEQVR4Xu2WS6hOURTHl0jkKiRdmdxbZh5DMxIiI8mte+9IHhlIMkEKZaBMvO6EPOqaSnTLY3BniJJXymNASoRSioEo8f+31u5b319f9/tuBo7Or/59Z/33Xufsfc7ea39mNTWVYBv0qw29hZ5ETqW4aT6BQ9CB0LXwLkJroB3Qi/Aqx0toqnivoXfikWdqVIHdEs83/1IXxCcf1PjXWaoGGDafYE+zbfOgK+JVkjdW0b3WLqVq/reMNcGj0CPzPh+hWdBC6HN4t6A90AzoS3iqb9BZc1jk6B2LWCk5x8UvY/hkfhK0xSLzpGHxlT5oSLzb1vxiLkOLU8y2jSnmsURYB05CD1Nb4bx53kptMB9Dfl5b7DRP2qwNAt92v3g/occp5lma4X17UjwYv/uhDeZfdUKj2bZCa6Gv0OTkFziGjid4yTypVxuEu1C3eLrMVqXr2dDzFJPyjFHzZc78OY1mOw1Ngq4mL8MxdDTBJeYJZ7RBWG/ejwPLojc39cscgQbUDLinCfPLqlgRv/ugZXGtsD/vOybLQyPmSTeg7eFNL50S3C/65qZBT8XL3LHWk18Xv7znXmimNVYCX9yUuFbYn38jMwskHhe8sRYEfgXdkwX6+kIKXemaFfc6tCXi1dY6j9vjgXiboMPijQs+9IR49+zPPVk4Za0HyiJSYNl/lWIuv1Z5XO56bLy35qrdMZwU/4vyoTzzJprf8Ed4HCArX+Gc+bJlG8VjZFdqL3n3zZchqynPTxaWsqepgyUhKGPgF+eZ+z3i8uVrampqav4KvwGCwp46+NDKqAAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAZCAYAAACl8achAAAB2ElEQVR4Xu2WOywEURSGfxHvZ4JIiBDR6BUKz0qQiJ6KyquR6ASV0Gg1QkSjUek0SomovBKFhkQECYkoFMI5jpHxz8zO7syi2S/5ij3/3HPvztydvUCGv+U9pln4B3pgkz+IzZQlYh82boMDH/LFR3i/sNtLscoZkAyLsIGnHIQwJj6LJRz40CauwubR+bpcbomv4qFY+nl1ktzDGg5yEMKKuMvFAM5gcwTh3PWk6YMNuBPrKEtEpTjLxQDCFvWCxLkvuQhvHAft+8ZFF/uwa4o5COMJNrCDgzSgfQ+46OIEdk1K+9phDTZ4h4MYDMN69nPgItZTLkTMBj7ojdCtUcSBC78568VaqgUyA2vQwkEEmmC9ljhwoU9Ar9mgeiN9TkgrvN86KqOwXr0cfKH/qkfirVhDWUrciHNcjMgmbNFBb4UpWM4//iHYzQslR9wT8ziIgd9eVbLFBfFabP8ZYVysgP84D3pXLrgYka4vnUU7n9UB2NPUejW8LIvTSGLR+mPo5mII+io75mKa0AWPcNGNnvD0JJYqesia52Ka0ENUuTjBgaJ7axupnY0nxSvYkfK3OIf3FfjNuljAxQA6YW8VZ5/q3vstGsQyLir6L+UsIIoZMmSIwQcIk4nvbwjT8QAAAABJRU5ErkJggg==>