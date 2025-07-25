# Quiz Platform

A modern, interactive quiz platform built with Next.js 15 and shadcn/ui. Create and deploy fill-in-the-blank quizzes using the efficient BQC (BioQuiz Compact) format.

## Features

- 🎯 **Interactive Fill-in-the-Blank Questions** - Real-time validation with visual feedback
- 📱 **Responsive Design** - Mobile-friendly interface built with Tailwind CSS
- ⚡ **Fast Performance** - Static generation with Next.js 15 and Bun runtime
- 🎨 **Modern UI** - Clean interface using shadcn/ui components
- 📊 **Progress Tracking** - Visual progress indicators across quiz sections
- 🔍 **Auto-Focus** - Automatic navigation to next question on correct answer
- 🎛️ **Section Navigation** - Easy movement between quiz sections

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz-platform
```

2. Install dependencies:
```bash
bun install
```

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Development Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run type-check   # Run TypeScript compiler check
```

## Creating Quiz Content

Quizzes are created using the BQC (BioQuiz Compact) format - a simple, efficient syntax for authoring fill-in-the-blank questions.

### BQC Format Example

Create a `.bqc` file in the `data/` directory:

```
---
slug: my-quiz
title: "Sample Quiz Topic"
description: "A demonstration quiz showing the BQC format"
author: "Quiz Author"
version: "1.0"
---

§ Introduction [#section-intro]

1. This is a sample {question::answer} with a fill-in-the-blank.

2. Multiple {correct|right|valid::acceptable answers} can be specified using pipes.

3. Answers can have {hints::helpful context} to guide users.
```

### BQC Syntax

- **Frontmatter**: YAML metadata at the top
- **Sections**: Start with `§ Section Title [#section-id]`
- **Questions**: Numbered items with fill-in-the-blank syntax
- **Blanks**: `{answer::hint}` or `{answer1|answer2::hint}` for multiple correct answers

## Project Structure

```
quiz-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (topic listing)
│   │   ├── layout.tsx         # Root layout
│   │   └── topics/[slug]/     # Dynamic topic routes
│   ├── components/
│   │   ├── ui/                # shadcn UI components
│   │   └── quiz/              # Quiz-specific components
│   ├── lib/
│   │   ├── types.ts           # TypeScript definitions
│   │   ├── bqc-parser.ts      # BQC format parser
│   │   └── questions.ts       # Data loading functions
├── data/                      # Quiz content files (.bqc)
├── public/                    # Static assets
└── package.json
```

## Adding New Quizzes

1. Create a new `.bqc` file in the `data/` directory
2. Follow the BQC format structure
3. The quiz will automatically appear on the home page
4. Static routes are generated at build time

## Deployment

The platform is optimized for static deployment:

```bash
bun run build
```

Deploy the `out/` directory to any static hosting service like Vercel, Netlify, or GitHub Pages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).