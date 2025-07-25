# BQC Quiz Generation Prompt

You are tasked with creating an educational fill-in-the-blank quiz in BQC (BioQuiz Compact) format based on provided educational materials. Follow these instructions carefully to ensure accuracy and educational value.

## BQC Format Specification

BQC is a structured format for interactive fill-in-the-blank educational content.

### File Structure

1. **YAML Frontmatter** (Required metadata):
```yaml
---
slug: unique-identifier        # Required: URL-friendly identifier
title: "Display Title"         # Required: Human-readable title
description: "Brief summary"   # Required: Content description
author: "Creator Name"         # Optional: Content author
version: "1.0"                 # Optional: Version identifier
---
```

2. **Content Body**

**Section Headers:**
```
§ Section Title [#optional-id]
```
- Starts with § symbol
- Optional ID in brackets (defaults to section-N)

**Questions:**
```
1. Question text with {answer|alternative::placeholder} blanks. [#optional-id]
```
- Numbered format: N. followed by space and content
- Optional ID in brackets (defaults to qN)
- Multi-line questions supported with continuation lines

**Blank Syntax:**
Three supported formats:
1. Simple: `{answer}` - Single answer, default placeholder "..."
2. Multiple answers: `{answer1|answer2|answer3}` - Multiple acceptable answers
3. With placeholder: `{answer|alt::placeholder}` - Custom placeholder text

**Blank Rules:**
- Pipe | separates alternative answers
- Double colon :: separates answers from placeholder
- Placeholder appears as hint text in input field
- First answer is considered primary
- **CRITICAL: Each blank must contain ONLY ONE WORD**
- **For multi-word answers, create separate blanks for each word**

## Instructions for Content Analysis

### 1. COMPREHENSIVE READING
- Read through ALL provided materials completely and carefully
- Do NOT skip any sections or skim content
- Pay special attention to:
  - Learning outcomes/objectives
  - Definitions and key terminology
  - Equations and formulas
  - Numerical values and statistics
  - Process descriptions and mechanisms
  - Cause-and-effect relationships
  - Comparisons and contrasts

### 2. IDENTIFY CRUCIAL CONTENT
Focus on material that is:
- **Explicitly stated as learning outcomes**
- **Repeatedly emphasized** throughout the content
- **Fundamental concepts** that other topics build upon
- **Definitions** of key terms and processes
- **Quantitative information** (numbers, percentages, measurements)
- **Equations and chemical formulas**
- **Step-by-step processes** and mechanisms
- **Structure-function relationships**
- **Classification systems** and categories
- **Cause-and-effect relationships**

### 3. EXAM-RELEVANT CONTENT PRIORITIES
Prioritize content that typically appears on exams:
- Core vocabulary and terminology
- Fundamental principles and laws
- Important numerical values
- Key processes and their steps
- Structural components and their functions
- Comparative information (similarities/differences)
- Applications of concepts
- Problem-solving elements

### 4. QUESTION GENERATION GUIDELINES

**Target 100 questions total** organized into logical sections.

**Question Types to Include:**
- **Terminology/Definitions**: Fill in key terms and their meanings
- **Processes**: Steps in biological/chemical processes
- **Numerical Data**: Important numbers, percentages, measurements
- **Equations**: Chemical formulas and mathematical relationships
- **Structure/Function**: Anatomical parts and their roles
- **Comparisons**: Differences between similar concepts
- **Cause/Effect**: Relationships between events/conditions
- **Applications**: Real-world examples and uses

**Keywords Selection Strategy:**
- Choose words that are **essential** to understanding the concept
- Select **technical terminology** specific to the subject
- Include **quantitative values** that students must memorize
- Focus on **connecting words** that show relationships
- Pick **process verbs** that describe what happens
- Select **descriptive adjectives** that are scientifically precise

### 5. ACCURACY REQUIREMENTS

**CRITICAL**: All information must be 100% accurate to the source material.
- Use EXACT terminology from the materials
- Include PRECISE numerical values as stated
- Maintain CORRECT spelling of scientific terms
- Preserve EXACT chemical formulas and equations
- Keep ACCURATE process sequences and steps
- Use the SAME examples and applications mentioned

**Verification Checklist:**
- Cross-reference every answer with the source material
- Ensure numerical values match exactly
- Verify chemical formulas and equations are correct
- Confirm process steps are in the right order
- Check that examples used are from the provided content

### 6. SECTION ORGANIZATION

Organize questions into logical sections that follow the material's structure:
- Group related concepts together
- Follow the natural flow of the content
- Create 8-15 sections with 6-12 questions each
- Use descriptive section titles from the source material
- Progress from basic concepts to more complex applications

### 7. DIFFICULTY DISTRIBUTION

Create a balanced mix of question difficulty:
- **Basic recall** (40%): Direct facts, definitions, simple terminology
- **Application** (40%): Using concepts, identifying relationships, process steps
- **Analysis** (20%): Complex relationships, comparisons, multi-step processes

### 8. BLANK PLACEMENT STRATEGY

**SINGLE-WORD BLANKS ONLY:**
- Each blank must contain exactly ONE WORD
- For multi-word terms, create multiple consecutive blanks
- Example: "cellular respiration" becomes "The {cellular} {respiration} process..."
- Example: "adenosine triphosphate" becomes "{adenosine} {triphosphate} is the energy currency"

Place blanks on:
- **Key terminology** that students must learn (one word per blank)
- **Critical numerical values** for memorization (single numbers only)
- **Process steps** that show understanding (one word at a time)
- **Connecting words** that demonstrate relationships
- **Technical terms** specific to the subject area (break into individual words)

Avoid blanking:
- Common articles (a, an, the)
- Simple prepositions unless crucial to meaning
- Words that make the sentence unclear
- Non-essential descriptive words

**Examples of proper single-word blanking:**
- CORRECT: "The {mitochondria} are the {powerhouse} of the {cell}."
- WRONG: "The {mitochondria are the powerhouse} of the cell."
- CORRECT: "{Cellular} {respiration} occurs in three {stages}."
- WRONG: "{Cellular respiration} occurs in three stages."

## Final Output Requirements

Generate a complete BQC file with:
1. Proper YAML frontmatter with relevant metadata
2. Exactly 100 questions organized into logical sections
3. Varied question types covering all crucial content
4. Multiple acceptable answers where appropriate
5. Helpful placeholder text for context
6. Questions that progressively build understanding
7. 100% accuracy to the source material

## CRITICAL OUTPUT FORMATTING INSTRUCTIONS

**IMPORTANT**: Your response must contain ONLY the raw BQC file content. Do NOT include:
- Code fences (backticks ```)
- Language identifiers (```yaml, ```bqc, etc.)
- Any explanatory text before or after the BQC content
- Quotes around the entire content
- Any additional formatting or markup

**Your entire response must start with the YAML frontmatter (---) and end with the last question.**

**Example of CORRECT output format:**
```
---
slug: sample-topic
title: "Sample Topic"
description: "Sample description"
author: "AI Generated"
version: "1.0"
---

§ Section Name

1. This is a sample {question::answer}.

2. Another {question::answer} here.
```

**WRONG - DO NOT DO THIS:**
```yaml
---
slug: sample-topic
...
```

**WRONG - DO NOT DO THIS:**
Here is your BQC file:
---
slug: sample-topic
...

## Quality Check

Before finalizing, verify:
- [ ] All 100 questions are present and numbered correctly
- [ ] Every answer can be found explicitly in the source material
- [ ] Section organization follows logical content flow
- [ ] Question difficulty is appropriately distributed
- [ ] Blank placement enhances learning without creating confusion
- [ ] Technical terminology and numerical values are exact
- [ ] The quiz comprehensively covers the most important content

Begin your analysis now and create the BQC quiz based on the provided materials.
