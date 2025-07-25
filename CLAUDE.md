# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results # Using Gemini CLI for Large Codebase Analysis


When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.


## File and Directory Inclusion Syntax
Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:
**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"


Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"


Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"


Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"


Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"
# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"


Implementation Verification Examples


Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"


Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"


Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"


Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"


Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"


Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"


Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"


Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"


When to Use Gemini CLI


Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase


Important Notes
- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

# Quiz Platform - Claude Instructions

## Project Overview
This is a quiz platform built with Bun, Next.js, and shadcn UI featuring interactive fill-in-the-blank questions for any subject matter.

## Tech Stack
- **Runtime**: Bun
- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Development Commands
```bash
# Development
bun run dev          # Start development server (http://localhost:3000)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run type-check   # Run TypeScript compiler check

# Package Management
bun install         # Install dependencies
bun add <package>   # Add new package
bun remove <package> # Remove package

# shadcn UI Components
bunx shadcn@latest add <component>  # Add shadcn component
```

## Project Structure
```
quiz-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (topic listing)
│   │   ├── layout.tsx         # Root layout
│   │   └── topics/[slug]/     # Dynamic topic routes
│   │       └── page.tsx       # Topic quiz page
│   ├── components/
│   │   ├── ui/                # shadcn UI components
│   │   │   ├── input.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── progress.tsx
│   │   └── quiz/              # Quiz-specific components
│   │       ├── blank-input.tsx    # Input with validation
│   │       ├── question.tsx       # Individual question
│   │       └── quiz-client.tsx    # Main quiz component
│   ├── hooks/
│   │   └── use-debounce.ts    # Debounce hook for input validation
│   ├── lib/
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── validation.ts      # Answer validation logic
│   │   ├── questions.ts       # Data loading functions
│   │   └── utils.ts           # Utility functions (shadcn)
├── data/
│   └── sample-topic.bqc       # Question data (BQC format)
├── public/                    # Static assets
├── package.json
├── bun.lockb                  # Bun lock file (commit this!)
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── next.config.js             # Next.js configuration
```

## Data Format
Quizzes are stored in BQC (BioQuiz Compact) format in the `data/` directory:

```
---
slug: sample-topic
title: "Sample Quiz Topic"
description: "A demonstration quiz"
author: "Quiz Author"
version: "1.0"
---

§ Introduction [#section-intro]

1. This is a sample {question::answer} with a fill-in-the-blank.

2. Multiple {correct|right|valid::acceptable answers} can be specified.
```

## Key Features Implemented
1. **Real-time Validation**: Debounced input validation with visual feedback
2. **Auto-Focus**: Automatic focus to next blank on correct answer
3. **Progress Tracking**: Visual progress indicator across all sections
4. **Section Navigation**: Navigate between different topic sections
5. **Responsive Design**: Mobile-friendly interface
6. **Static Generation**: Pre-rendered pages for optimal performance

## Component Architecture
- **Server Components**: Page components for data fetching
- **Client Components**: Interactive quiz components with state management
- **Separation of Concerns**: Validation logic, data loading, and UI components are modular

## Validation Logic
- Case-insensitive matching
- Whitespace trimming
- Multiple correct answers support
- Visual feedback (green/red borders)
- Debounced validation (300ms default)

## Adding New Quizzes
1. Create a new BQC file in `data/` directory
2. Follow the BQC format structure
3. The quiz will automatically appear on the home page
4. Static routes will be generated at build time

## Development Notes
- Uses Bun instead of npm for faster performance
- Commit `bun.lockb` to version control
- TypeScript strict mode enabled
- ESLint and type checking in build process
- Optimized for static generation with SSG
