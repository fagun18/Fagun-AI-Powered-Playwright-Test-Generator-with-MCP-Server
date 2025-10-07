# Basic Operations Test Plan

## Scope
- Validate core user flows for the application

## Scenarios

### Scenario: Guest can navigate homepage
- Steps:
  - Open the homepage
  - Verify title and primary navigation is visible
  - Capture a screenshot
- Expected:
  - Title matches the product name
  - Primary navigation contains expected entries

### Scenario: Search returns results
- Prerequisites: Seed initializes page and fixtures
- Steps:
  - Type a common term into the search input
  - Submit search
  - Wait for results list
- Expected:
  - At least one result row is visible
  - Each result contains title and link


