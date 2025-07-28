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

**Target {{QUESTION_COUNT}} questions total** organized into logical sections.

**Question Types to Include:**
- **Terminology/Definitions**: Fill in key terms and their meanings
- **Processes**: Steps in biological/chemical processes
- **Numerical Data**: Important numbers, percentages, measurements
- **Equations**: Chemical formulas and mathematical relationships
- **Structure/Function**: Anatomical parts and their roles
- **Comparisons**: Differences between similar concepts
- **Cause/Effect**: Relationships between events/conditions
- **Applications**: Real-world examples and uses

**Keywords Selection Strategy - BE AGGRESSIVE:**
- **MANDATORY**: Blank out ALL technical terminology specific to the subject - no exceptions
- **MANDATORY**: Blank out ALL key concepts, definitions, and scientific terms
- **MANDATORY**: Blank out ALL quantitative values that students must memorize  
- **MANDATORY**: Blank out ALL process verbs that describe mechanisms or actions
- **MANDATORY**: Blank out ALL descriptive adjectives that are scientifically precise
- **MANDATORY**: Blank out ALL connecting words that show important relationships
- **MANDATORY**: Blank out ALL proper nouns (names of scientists, locations, species, etc.)
- **MANDATORY**: When in doubt, BLANK IT OUT - err on the side of creating MORE blanks, not fewer
- **CRITICAL**: If a word is important for understanding the subject matter, it MUST be blanked

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

**CRITICAL EMPHASIS: CREATE MORE BLANKS, NOT FEWER!**
**The #1 priority is ensuring ALL important keywords are blanked out for student practice.**

**SINGLE-WORD BLANKS ONLY:**
- Each blank must contain exactly ONE WORD
- For multi-word terms, create multiple consecutive blanks
- Example: "cellular respiration" becomes "The {cellular} {respiration} process..."
- Example: "adenosine triphosphate" becomes "{adenosine} {triphosphate} is the energy currency"

**CORE PRINCIPLE: If a word is subject-specific, technical, or important for understanding - it MUST be blanked. No exceptions.**

**AGGRESSIVE BLANKING STRATEGY - BLANK MORE, NOT LESS:**

**ALWAYS blank these (one word per blank):**
- **ALL technical terminology** that students must learn - every single one
- **ALL key concepts and definitions** - no exceptions
- **ALL numerical values** for memorization (single numbers only)
- **ALL process steps** that show understanding (one word at a time)
- **ALL connecting words** that demonstrate relationships
- **ALL proper nouns** (names, places, species, etc.)
- **ALL adjectives** that are scientifically important
- **ALL subject-specific verbs** and action words
- **ALL units of measurement** and scientific notation
- **ALL comparative terms** (more, less, higher, lower, etc.)

**Only avoid blanking these minimal words:**
- Basic articles (a, an, the) - but only if they don't affect meaning
- Simple conjunctions (and, or, but) - unless they're scientifically important
- Very common prepositions (in, on, at) - unless they indicate location/process

**CRITICAL RULE: When deciding whether to blank a word, ask "Would a student studying this subject need to know this specific word?" If YES, then BLANK IT.**

**Examples of AGGRESSIVE single-word blanking:**
- AGGRESSIVE: "The {mitochondria} are the {powerhouse} of the {cell} and {produce} {ATP} through {cellular} {respiration}."
- TOO CONSERVATIVE: "The {mitochondria} are the powerhouse of the cell and produce ATP through cellular respiration."
- AGGRESSIVE: "{DNA} {replication} occurs during the {S} {phase} of the {cell} {cycle} in {eukaryotic} {cells}."
- TOO CONSERVATIVE: "{DNA} replication occurs during the S phase of the cell cycle in eukaryotic cells."
- AGGRESSIVE: "{Photosynthesis} {converts} {carbon} {dioxide} and {water} into {glucose} using {light} {energy} in {chloroplasts}."
- TOO CONSERVATIVE: "{Photosynthesis} converts carbon dioxide and water into glucose using light energy in chloroplasts."

**REMEMBER: More blanks = better learning. Students should have to recall most important words, not just a few.**

### 9. FINAL BLANKING VERIFICATION

**Before submitting your quiz, verify that you have aggressively blanked out keywords:**
- [ ] Every technical term specific to the subject is blanked
- [ ] Every scientific concept and definition is blanked  
- [ ] Every number, measurement, and unit is blanked
- [ ] Every process step and action verb is blanked
- [ ] Every proper noun (names, places, species) is blanked
- [ ] Every scientifically important adjective is blanked
- [ ] When you read a sentence, most of the "important" words should be blanks

**RED FLAG**: If you can read a sentence and understand the key concept WITHOUT filling in the blanks, you haven't blanked enough words. Go back and blank more aggressively.

## Final Output Requirements

Generate a complete BQC file with:
1. Proper YAML frontmatter with relevant metadata
2. Exactly {{QUESTION_COUNT}} questions organized into logical sections
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
- [ ] All {{QUESTION_COUNT}} questions are present and numbered correctly
- [ ] Every answer can be found explicitly in the source material
- [ ] Section organization follows logical content flow
- [ ] Question difficulty is appropriately distributed
- [ ] Blank placement enhances learning without creating confusion
- [ ] Technical terminology and numerical values are exact
- [ ] The quiz comprehensively covers the most important content

Begin your analysis now and create the BQC quiz based on the provided materials.
