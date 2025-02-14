# Project Summary

## Problem
Lack of apps offering truly local + offline app allowing celiacs to feel comfortable to eat wherever they go. The main struggle is the challenge to identify gluten ingredients and common cross-contamination ingredients wherever they are.

## Proposal
Develop a companion application which accomplishes the following:
- User can add personal settings and everything is kept local/secure.
- App is usable offline and local first.
- User can search or scan products to determine risk level.
- Users can subscribe for updates for favorite products.
- Users can ask an AI to check common groups both official and social to enhance the report.

## Non-functional Requirements
- Offline support and mobile ready.
- Model should be accurate and with guardrails.
- No hallucinations.
- We will need to address the issue of relying on outdated info, however.
- Responses should be within 30 seconds - only <5% of requests should be above 1 min.
- Should be robust in various network conditions.
- Fault-tolerant and able to be reasonably reliable (close to whatever cloud platforms offer since we build on them).
- Should be efficient in terms of tokens and ideally economically free via local models.