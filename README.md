# Tableau MCP

[![Tableau Supported](https://img.shields.io/badge/Support%20Level-Tableau%20Supported-53bd92.svg)](https://www.tableau.com/support-levels-it-and-developer-tools)

[![Build and Test](https://github.com/tableau/tableau-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tableau/tableau-mcp/actions/workflows/ci.yml)

[![npm](https://img.shields.io/npm/v/@tableau/mcp-server)](https://www.npmjs.com/package/@tableau/mcp-server)

## Overview

Tableau MCP is a suite of developer primitives, including tools, resources and prompts, that will
make it easier for developers to build AI applications that integrate with Tableau.

## Official Documentation

https://tableau.github.io/tableau-mcp/

## Quick Start

### Requirements

- Node.js 22.7.5 or newer
- An MCP client e.g. Claude Desktop, Cursor, VS Code, MCP Inspector, etc.

Standard config works in most MCP clients:

```json
{
  "mcpServers": {
    "tableau": {
      "command": "npx",
      "args": ["-y", "@tableau/mcp-server@latest"],
      "env": {
        "SERVER": "https://my-tableau-server.com",
        "SITE_NAME": "my_site",
        "PAT_NAME": "my_pat",
        "PAT_VALUE": "pat_value"
      }
    }
  }
}
```

## Deploy to Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/tableau/tableau-mcp)

## Available Tools

### Project Management
- **list-projects** - List and filter projects with pagination
- **create-project** - Create new projects (admin-only)
- **update-project** - Update project properties (admin-only)
- **delete-project** - Delete projects with confirmation (admin-only)

### User Management
- **list-users** - List and filter users with pagination
- **get-user** - Get user details by ID
- **list-groups-for-user** - List groups a user belongs to
- **create-user** - Create new users (admin-only)
- **update-user** - Update user properties (admin-only)
- **delete-user** - Delete users with confirmation (admin-only)

### Group Management
- **list-groups** - List and filter groups with pagination
- **create-group** - Create new groups (admin-only)
- **update-group** - Update group properties (admin-only)
- **delete-group** - Delete groups with confirmation (admin-only)
- **list-users-in-group** - List users in a specific group
- **add-user-to-group** - Add a user to a group (admin-only)
- **remove-user-from-group** - Remove a user from a group (admin-only)

### Permissions Management
- **list-project-permissions** - List permissions for a project
- **list-workbook-permissions** - List permissions for a workbook
- **list-datasource-permissions** - List permissions for a datasource
- **list-view-permissions** - List permissions for a view
- **list-default-permissions** - List default permissions for a project
- **add-permissions** - Add permissions to a resource
- **update-default-permissions** - Update default permissions for a project
- **delete-permission** - Delete a specific permission
- **delete-default-permission** - Delete a default permission from a project

### Extract Refresh Management
- **list-extract-refresh-tasks** - List extract refresh tasks with pagination
- **get-extract-refresh-task** - Get details for a specific task
- **create-extract-refresh-task** - Create a new extract refresh task (Cloud only)
- **update-extract-refresh-task** - Update an existing task (Cloud only)
- **run-extract-refresh-task** - Run a task immediately
- **delete-extract-refresh-task** - Delete a task with confirmation

### Data Sources
- **list-datasources** - List and filter data sources
- **get-datasource-metadata** - Get metadata for a data source
- **query-datasource** - Query data from a data source

### Workbooks & Views
- **list-workbooks** - List and filter workbooks
- **get-workbook** - Get workbook details
- **list-views** - List and filter views
- **get-view-data** - Get view data in CSV format
- **get-view-image** - Get view as PNG image

### Pulse Metrics
- **list-all-pulse-metric-definitions** - List all Pulse metric definitions
- **list-pulse-metric-definitions-from-definition-ids** - Get specific metric definitions
- **list-pulse-metrics-from-metric-definition-id** - Get metrics for a definition
- **list-pulse-metrics-from-metric-ids** - Get specific metrics
- **list-pulse-metric-subscriptions** - List user's metric subscriptions
- **generate-pulse-metric-value-insight-bundle** - Generate metric insights
- **generate-pulse-insight-brief** - Generate insight briefs

### Content Exploration
- **search-content** - Search for workbooks, views, and data sources

## Example Prompts to Client

#### Prompt #1: Querying Data

```
For the Superstore Datasource, what are the top 5 states with the most sales in 2025?
```

#### Response

```
Based on the Superstore Datasource, here are the top 5 states with the most sales in 2025:
  1. California - $146,388.34
  2. New York - $93,922.99
  3. Washington - $65,539.90
  4. Texas - $43,421.76
  5. Pennsylvania - $42,688.31
California leads by a significant margin with over $146,000 in sales, followed by New York with nearly $94,000. These two states alone account for a substantial portion of the total sales across the top 5 states.
```

#### Prompt #2: Content Exploration

```
Find me the most viewed workbook within the last year.
```

#### Response

```
The most viewed workbook within the last year is:

Global Connections
- Owner: John Doe
- Project: Marketing
- Views in last year: 523
- Last Modified: September 2, 2025
- Workbook ID: 111fb672-9401-4913-a167-17b3d89a3e4f
```

#### Prompt #3: Getting a View

```
Show me an image of the "Economy" view in the "Finances" project.
```

#### Response

![Economy View Image](docs/static/img/economy-view.png)
