---
title: Runtime Environment Requirements
description: The infrastructure dependencies including database, caching, email, S3, and standard deployment practices.
sidebar:
  order: 5
---

This document traces the infrastructure dependency graph of a live Community RSS installation.

## 1. External Integrations

- **FreshRSS:** The framework delegates all polling and background syndication tasks to a connected FreshRSS instance. The Node container orchestrates its configuration via API commands, but it relies exclusively on FreshRSS to normalize syndication inputs.
- **SQL Database:** The platform uses `better-sqlite3` and the Drizzle ORM to maintain core structures (Profiles, Hearts, Stars, Comments, Feed Mapping).
- **Authentication:** Sessions and verification events are entirely driven by the `better-auth` integration API.
- **Node.js Environment:** The framework must compile efficiently using the `@astrojs/node` build adapter for standalone distribution. 

## 2. Default Configuration

For simplicity and ease of access, a Docker Compose definition configures everything instantly on a local machine:
- Node Server container
- FreshRSS container
- MinIO instance (for internal/local-only S3-compatible test modeling)
- Mailpit instance (for interception and visual preview of outgoing magic links)

## 3. Remote Adapters (Production)

To migrate out of basic Docker setups onto distinct production architecture seamlessly, the core package supports configuration and routing for:
- Live S3 bucket environments (Cloudflare R2, AWS S3).
- Resend or standard SMTP transactional email services in place of Mailpit instances.
