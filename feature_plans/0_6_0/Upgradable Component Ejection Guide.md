# **Architecture Guide: Upgradable Component Ejection**

## **The Problem: Customization vs. Upgradability**

In our Astro framework, we want to give developers the ultimate freedom to customize the UI. Traditionally, "ejecting" a component means copying the entire source code into the developer's local project.

However, standard ejection creates a massive maintenance burden. If a developer ejects Profile.astro to change one button, they are now cut off from all future bug fixes, accessibility improvements, and feature additions applied to the core Profile.astro component in future framework updates.

## **The Solution: The Proxy Ejection Pattern**

Instead of ejecting the *logic*, our framework ejects a **Wrapper Component**.

When a developer runs the eject command for a component, we generate a local file that imports the Core component and passes all props down to it. We then utilize Astro's \<slot\> architecture to provide specific "hook points" where the developer can override the UI.

This pattern guarantees:

1. **Core logic remains upgradable** via NPM updates.  
2. **Styling and structure can be safely overridden** using Slots.  
3. **Zero layout shift** upon initial ejection.

## **Understanding Slot Inheritance (How Fallbacks Work)**

Before diving into the code, it is critical to understand how Astro handles slots—specifically when they are *not* provided.

In our Core components, every slot (both named and unnamed) contains **fallback content**.

### **1\. The Named Slots (\<slot name="header"\>)**

These are specific zones designed for injection (e.g., header, footer, action bars).

* If the wrapper component provides \<Fragment slot="header"\>My Content\</Fragment\>, the Core renders "My Content".  
* If the wrapper provides nothing, the Core renders its fallback.  
* If the wrapper provides an *empty* \<Fragment slot="header" /\>, the Core renders **nothing** (effectively hiding that section).

### **2\. The Unnamed / Default Slot (\<slot\>)**

The unnamed slot represents the "body" or primary content area of the component.

**To answer the common question: Yes, the unnamed slot has fallback content too.** If you render the core component like this: \<CoreProfile /\> (with absolutely no children inside the tags), Astro will look inside the Core component and render whatever is inside the \<slot\>\</slot\> tags. The unnamed slot behaves exactly like a named slot in terms of inheriting the core's fallback design.

## **Code Examples**

### **1\. The Core Component (Inside node\_modules)**

This is the framework's engine. Notice how every slot wraps default HTML. This ensures the component works perfectly out-of-the-box.

\---  
// @our-framework/core/components/Profile.astro  
// This file is managed by the framework and updated via NPM.  
const { user, ...rest } \= Astro.props;  
\---

\<div class="profile-card" {...rest}\>  
    
  \<\!-- NAMED SLOT: Header \--\>  
  \<header class="profile-header"\>  
    \<slot name="header"\>  
      \<\!-- FALLBACK: Renders if the developer doesn't provide a 'header' slot \--\>  
      \<img src={user.avatar} alt="Avatar" /\>  
      \<h2\>{user.displayName}\</h2\>  
    \</slot\>  
  \</header\>

  \<\!-- UNNAMED (DEFAULT) SLOT: Main Body \--\>  
  \<main class="profile-body"\>  
    \<slot\>  
      \<\!-- FALLBACK: Renders if the developer provides NO child elements at all \--\>  
      \<p\>Bio: {user.bio || "This user hasn't written a bio yet."}\</p\>  
      \<div class="default-stats"\>  
        \<span\>Followers: {user.followers}\</span\>  
      \</div\>  
    \</slot\>  
  \</main\>

  \<\!-- NAMED SLOT: Footer \--\>  
  \<footer class="profile-footer"\>  
    \<slot name="footer"\>  
      \<\!-- FALLBACK \--\>  
      \<button\>Follow\</button\>  
    \</slot\>  
  \</footer\>

\</div\>

### **2\. The Ejected Component (In the Developer's Project)**

When a developer runs the framework's eject command (e.g., npx framework eject profile), this is the exact file generated in their local src/components/overrides/ folder.

Notice that **everything is commented out by default**. Because no slots or children are being passed to \<CoreProfile\>, the Core component will render all of its default fallbacks. The UI will look 100% identical to how it looked before ejection.

\---  
// src/components/overrides/Profile.astro  
// THIS IS YOUR LOCAL OVERRIDE FILE.  
// It wraps the core component to ensure you continue receiving framework updates.

import { Profile as CoreProfile } from '@our-framework/core';

// Catch all props passed to this component so we can forward them to the Core  
const props \= Astro.props;  
\---

\<CoreProfile {...props}\>  
    
  {/\* \=========================================  
    NAMED SLOT OVERRIDES  
    Uncomment the Fragments below to replace specific sections of the Core UI.  
    \=========================================   
  \*/}

  {/\* \<Fragment slot="header"\>  
    \<div class="my-custom-header"\>  
      \<h1\>{props.user.displayName}\</h1\>  
      \<span class="pro-badge"\>PRO\</span\>  
    \</div\>  
  \</Fragment\>   
  \*/}

  {/\* \=========================================  
    UNNAMED (DEFAULT) SLOT OVERRIDE  
    Uncomment the section below to replace the main body/bio area.  
    If left commented, the Core component's default body will render.  
    \=========================================   
  \*/}

  {/\* \<section class="my-custom-body"\>  
    \<p\>Custom Bio Layout: {props.user.bio}\</p\>  
  \</section\>   
  \*/}

  {/\* \<Fragment slot="footer"\>  
    \<button class="my-custom-btn"\>Add Friend\</button\>  
  \</Fragment\>   
  \*/}

\</CoreProfile\>

\<style\>  
  /\* Add any local custom CSS here. It will only apply to this wrapper. \*/  
  .my-custom-header {  
    background: \#f4f4f4;  
    padding: 1rem;  
  }  
\</style\>

## **Best Practices for Developers**

1. **Uncomment only what you need:** If you only want to change the footer, leave the header and default slots commented out. You will continue to get UI updates for the header and body from the core framework\!  
2. **Deleting a section completely:** If you want a section to be completely empty (removing the core's default UI), uncomment the Fragment but leave it empty: \<Fragment slot="footer" /\>  
3. **Prop access:** Because props are caught at the top of the file, you have full access to props.user or any other data the core component utilizes to build your custom UI.