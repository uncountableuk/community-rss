# **Local Development Environment Setup**

This document outlines the architecture and setup instructions for developing the **Community RSS Framework** locally. We use Docker Compose, Cloudflare Wrangler, and VS Code Dev Containers to simulate the production environment entirely on your local machine.

Because you are building an installable framework, this setup uses an **NPM Workspaces (Monorepo)** structure. You will develop the core package in /packages/core and instantly test the UI in the /playground Astro app.

## **1\. Local Architecture Mapping**

| Production Component | Local Simulation Tool | How it works locally |
| :---- | :---- | :---- |
| **Monorepo Workspace** | VS Code Dev Container | An isolated Node.js environment mounting your root repository. |
| **Astro Playground** | Astro Dev Server | Runs inside the container at playground/, exposed to your host on localhost:4321. |
| **Cloudflare D1 & Queues** | Local Miniflare | Wrangler simulates these in memory/local SQLite *specifically for the playground app*. |
| **FreshRSS** | Docker (freshrss/freshrss) | Standard instance. Exposed to host on 8080, available to dev container as http://freshrss:80. |
| **DigitalOcean S3 / R2** | Docker (minio/minio) | MinIO local object storage. API on 9000, Console on 9001\. |
| **Resend (Emails)** | Docker (axllent/mailpit) | Catches all outgoing emails. Web UI on 8025, SMTP on 1025\. |

## **2\. Docker Compose Configuration (Root Level)**

Create docker-compose.yml in the **root** of your monorepo.

version: '3.8'

services:  
  \# 1\. Node Dev Container: Your isolated VS Code workspace  
  app:  
    image: \[mcr.microsoft.com/devcontainers/javascript-node:20\](https://mcr.microsoft.com/devcontainers/javascript-node:20)  
    container\_name: local\_astro\_dev  
    volumes:  
      \- ./:/workspace  
    working\_dir: /workspace  
    ports:  
      \- "4321:4321" \# Astro dev server (Playground)  
    command: sleep infinity  
    environment:  
      \- CHOKIDAR\_USEPOLLING=true \# Helps Astro watch for file changes in Docker volumes

  \# 2\. FreshRSS: The ingestion engine  
  freshrss:  
    image: freshrss/freshrss:latest  
    container\_name: local\_freshrss  
    ports:  
      \- "8080:80"  
    environment:  
      \- TZ=Europe/London  
      \- CRON\_MIN=1,31  
    volumes:  
      \- ./docker-data/freshrss:/var/www/FreshRSS/data

  \# 3\. MinIO: S3-Compatible Object Storage for Image Caching  
  minio:  
    image: minio/minio:latest  
    container\_name: local\_s3  
    command: server /data \--console-address ":9001"  
    ports:  
      \- "9000:9000" \# S3 API Port  
      \- "9001:9001" \# Web Console Port  
    environment:  
      \- MINIO\_ROOT\_USER=localadmin  
      \- MINIO\_ROOT\_PASSWORD=localpassword  
    volumes:  
      \- ./docker-data/minio:/data

  \# 4\. Mailpit: Local Email Catcher for Magic Links & Moderation  
  mailpit:  
    image: axllent/mailpit  
    container\_name: local\_mailpit  
    ports:  
      \- "8025:8025" \# Web UI to view caught emails on host  
    environment:  
      \- MP\_MAX\_MESSAGES=500

## **3\. Playground Configuration (App Level)**

Because the playground/ directory represents a standard user installing your framework, **all Cloudflare configurations must live inside the playground/ folder**, not the root.

### **A. playground/wrangler.toml**

Defines the local D1 database and Queue bindings for your test environment.

name \= "community-rss-playground"  
compatibility\_date \= "2024-03-20"

\[\[d1\_databases\]\]  
binding \= "DB"  
database\_name \= "community\_db"  
database\_id \= "local-dev-id"

\[\[queues.producers\]\]  
binding \= "ARTICLE\_QUEUE"  
queue \= "article-processing-queue"

\[\[queues.consumers\]\]  
queue \= "article-processing-queue"  
max\_batch\_size \= 10  
max\_batch\_timeout \= 5

### **B. playground/.dev.vars**

Environment variables for the Playground app to talk to the Docker backend services.

PUBLIC\_SITE\_URL="http://localhost:4321"

\# FreshRSS Connection (Internal Docker Network)  
FRESHRSS\_API\_URL="http://freshrss:80/api/greader.php"  
FRESHRSS\_USER="admin"  
FRESHRSS\_APP\_PASSWORD="your-local-app-password"

\# MinIO (Local S3) Connection (Internal Docker Network)  
S3\_ENDPOINT="http://minio:9000"  
S3\_REGION="us-east-1"  
S3\_BUCKET="community-images"  
S3\_ACCESS\_KEY="localadmin"  
S3\_SECRET\_KEY="localpassword"  
PUBLIC\_S3\_URL="http://localhost:9000/community-images"

\# Email Configuration (Internal Docker Network)  
SMTP\_HOST="mailpit"  
SMTP\_PORT="1025"

## **4\. Workspaces Setup (package.json)**

To ensure Hot Module Replacement (HMR) works between your framework code and the playground, configure the **root** package.json:

{  
  "name": "community-rss-monorepo",  
  "private": true,  
  "workspaces": \[  
    "packages/\*",  
    "playground"  
  \]  
}

In your **playground/package.json**, ensure you expose Astro to the host machine so you can access it outside the Docker container:

{  
  "name": "playground",  
  "scripts": {  
    "dev": "astro dev \--host 0.0.0.0"   
  },  
  "dependencies": {  
    "@community-rss/core": "\*"  
  }  
}

## **5\. First Run Checklist & Copilot Workflow**

1. **Start Infrastructure:** Open your host terminal in the root folder and run docker compose up \-d.  
2. **Attach VS Code:** Open VS Code, press Ctrl+Shift+P, type **Dev Containers: Attach to Running Container**, and select local\_astro\_dev.  
3. **Initialize Monorepo:** In the VS Code terminal (which opens at /workspace), run npm install. This wires up the symlink between /packages/core and /playground.  
4. **Setup External Services (One-time):**  
   * Visit http://localhost:8080 (Host browser) to create your FreshRSS admin user and API password.  
   * Visit http://localhost:9001 (Host browser, MinIO Console). Log in with localadmin/localpassword, create the community-images bucket, and set its Access Policy to public.  
5. **Apply Database Schema:** Ensure your terminal is in the playground directory:  
   cd playground  
   npx wrangler d1 execute community\_db \--local \--file=../packages/core/schema.sql *(Assuming you store your baseline schema in the core package).*  
6. **Start Development:** While still in the playground/ directory, run npm run dev.  
7. **View Application:** Visit http://localhost:4321. Edit a file in /packages/core/... and watch the browser hot-reload instantly\!  
8. **View Emails:** Visit http://localhost:8025 to see any Magic Links generated by the Auth flow.

### **Tips for GitHub Copilot Agent:**

* Always remind Copilot that it is working within an **NPM Workspace Monorepo**.  
* If you ask it to generate database queries, tell it: *"Write the D1 SQLite query for \[Feature\] and place it in the @community-rss/core package data layer."*  
* When testing Cloudflare Cron triggers locally, you can trigger them manually by opening a new VS Code terminal and running: curl \-X GET "http://localhost:4321/\_\_scheduled" (This request must be sent from inside the container or via your browser).