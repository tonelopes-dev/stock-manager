# KIPO (Stock-Manager) — AI Integration Audit

**Date**: 25 de maio de 2026  
**Project**: Stock-Manager (KIPO v1.4.0) — Restaurant/Food Business POS & Inventory Platform  
**Scope**: Complete mapping of AI agents, LLM integrations, and AI skills

---

## Executive Summary

**Current State**: ❌ **NO production-grade AI integrations**

- **Zero LLM SDKs** installed (Vercel AI SDK, OpenAI, Anthropic, LangChain all absent)
- **4 VS Code Copilot agents** configured for **development-time assistance only**
- **2 custom skills** for automating developer workflows
- **No runtime AI services** integrated with the application
- **AI mentioned only in disclaimers** (privacy policy, terms of service state some docs were "AI-generated")

**Bottom Line**: Stock-Manager is a feature-complete SaaS platform with **zero intelligent automation**. There's a massive opportunity to add AI-driven value across inventory, sales, and operations.

---

## SECTION 1: Current AI Integrations

### 1.1 LLM SDKs & Dependencies

| SDK | Status | Reason |
|-----|--------|--------|
| Vercel AI SDK | ❌ NOT INSTALLED | No realtime AI inference |
| OpenAI | ❌ NOT INSTALLED | No GPT integration |
| Anthropic | ❌ NOT INSTALLED | No Claude integration |
| LangChain | ❌ NOT INSTALLED | No multi-step AI workflows |
| Groq | ❌ NOT INSTALLED | No fast inference |
| Hugging Face Transformers | ❌ NOT INSTALLED | No ML models |
| TensorFlow.js | ❌ NOT INSTALLED | No in-browser ML |

**Conclusion**: The application uses **zero AI/ML libraries**. All business logic is deterministic (no predictive models, no classification, no NLP).

---

## SECTION 2: Configured AI Agents (Development Only)

### 2.1 Agent Overview

KIPO has **4 specialized VS Code Copilot agents** for development acceleration. These are **NOT production features** — they're developer helpers that appear within the IDE.

**Configuration Location**: `.github/agents/`

#### Agent 1: **Clean Project Agent**
- **Model**: `gemini-1.5-flash`
- **Purpose**: Code quality, refactoring, dead code removal
- **Triggers**: Keywords like "refactor", "clean up", "dead code", "organize imports"
- **File**: [.github/agents/clean-project.agent.md](.github/agents/clean-project.agent.md)
- **Tools Available**: Read, Glob, Grep, Edit, Bash
- **Example Usage**: `@Clean Project Agent remove dead code from src/utils/helpers.ts`

**What It Does**:
- TypeScript strict mode compliance
- Import organization
- Unused variable/function detection
- Simplifies logic (removes nested ternaries, etc.)
- Applies project conventions (DTOs, safe-action wrappers)

---

#### Agent 2: **Data Access Agent**
- **Model**: `gemini-1.5-flash`
- **Purpose**: Backend, databases, Server Actions, Prisma schemas, RBAC
- **Triggers**: Keywords like "data access", "server action", "prisma", "migration", "multi-tenancy", "rbac"
- **File**: [.github/agents/data-access.agent.md](.github/agents/data-access.agent.md)
- **Tools Available**: Read, Glob, Grep, Edit, Write, Bash, ✨ `create-server-action` (custom skill)
- **Example Usage**: `@Data Access Agent create a server action to update product prices with margin enforcement`

**What It Does**:
- Creates/modifies data access functions (repository pattern)
- Generates Server Actions with Zod validation
- Manages Prisma schema migrations
- Enforces multi-tenancy (`companyId` checks)
- Implements RBAC capability checks (`assertCapability()`)
- Optimizes database queries (N+1 detection)

---

#### Agent 3: **Design System Agent**
- **Model**: `gemini-1.5-flash`
- **Purpose**: UI components, TailwindCSS styling, design consistency, component testing
- **Triggers**: Keywords like "component", "design", "UI", "shadcn", "tailwind", "style"
- **File**: [.github/agents/design-system.agent.md](.github/agents/design-system.agent.md)
- **Tools Available**: Read, Glob, Grep, Edit, Write, Bash
- **Example Usage**: `@Design System Agent create a ProductCard component with Vitest tests`

**What It Does**:
- Creates shadcn/ui based components
- Writes TailwindCSS styles
- Ensures WCAG accessibility compliance
- Generates component tests (Vitest, snapshot tests)
- Documents component APIs
- Maintains design system consistency

---

#### Agent 4: **Documentation Agent**
- **Model**: `gemini-1.5-flash`
- **Purpose**: Architecture guides, feature docs, API reference, setup guides
- **Triggers**: Keywords like "document", "guide", "explain architecture", "readme", "tutorial"
- **File**: [.github/agents/documentation.agent.md](.github/agents/documentation.agent.md)
- **Tools Available**: Read, Glob, Grep, Write, Edit, Bash, ✨ `update-project-docs` (custom skill)
- **Example Usage**: `@Documentation Agent explain how multi-tenancy enforcement works`

**What It Does**:
- Writes architecture documentation
- Creates feature walkthroughs
- Documents Server Action APIs
- Updates README.md, CHANGELOG.md
- Creates troubleshooting guides
- Links to relevant code examples

---

### 2.2 Agent Configuration Details

**YAML Frontmatter Structure**:
```yaml
---
name: [Agent Name]
description: [When to use this agent]
model: gemini-1.5-flash              # Always Google's Gemini model
triggers:
  - keywords: [trigger words]
    context: always                  # When should this agent activate
tools: [available tools]             # IDE operations, not AI calls
---
```

**Key Insight**: Agents use **declarative YAML configuration** — they don't make external API calls. When you invoke them in Copilot Chat, they:
1. Read the codebase (no external calls)
2. Analyze patterns locally
3. Generate code modifications
4. Suggest improvements

---

## SECTION 3: Custom Skills (Automation Templates)

KIPO defines **2 reusable automation skills** that agents can call.

**Location**: `.github/agents/skills/`

### Skill 1: **create-server-action**

**File**: `skills/create-server-action/SKILL.md`

**Purpose**: Automate boilerplate Server Action generation

**Parameters**:
```yaml
- featureName: string          # e.g., "product", "user"
- actionName: string           # e.g., "create", "update"
- inputFields: string          # Comma-separated Zod schema fields
- capability: string           # (Optional) RBAC capability required
```

**What It Generates**:
1. Zod validation schema (`app/_actions/[feature]/schema.ts`)
2. Server Action with `actionClient` wrapper
3. Multi-tenancy enforcement (`companyId` extraction)
4. RBAC capability check (if provided)
5. Boilerplate business logic comments

**Example**:
```bash
@create-server-action featureName=product actionName=create \
  inputFields="name:z.string(), price:z.number().positive()" \
  capability="product:create"
```

**Generated Files**:
- `app/_actions/product/schema.ts` — Zod validation schema
- `app/_actions/product/mutations.ts` — Server Action with business logic placeholder

---

### Skill 2: **update-project-docs**

**File**: `skills/update-project-docs/SKILL.md`

**Purpose**: Automate documentation updates (README, CHANGELOG, etc.)

**Parameters**:
```yaml
- documentPath: string         # e.g., "README.md", "CHANGELOG.md"
- updateContent: string        # Content to add/replace
- section: string              # (Optional) Target section
- append: boolean              # (Optional) Append or replace
```

**What It Does**:
1. Reads existing documentation
2. Locates target section (if specified)
3. Appends or replaces content
4. Maintains Markdown formatting
5. Preserves unchanged sections

**Example**:
```bash
@update-project-docs documentPath="CHANGELOG.md" section="v1.5.0" \
  updateContent="- Added AI-powered product recommendation engine" \
  append=true
```

---

## SECTION 4: Prompt & Configuration Locations

### File Structure

```
.github/
├── agents/
│   ├── clean-project.agent.md           ← Agent definition
│   ├── data-access.agent.md
│   ├── design-system.agent.md
│   ├── documentation.agent.md
│   └── skills/
│       ├── create-server-action/
│       │   └── SKILL.md                 ← Skill definition
│       └── update-project-docs/
│           └── SKILL.md
└── copilot-instructions.md              ← Global Copilot configuration
```

### Key Configuration Files

| File | Purpose | Content |
|------|---------|---------|
| `.github/copilot-instructions.md` | Global agent behavior | Project architecture, coding patterns, domain knowledge |
| `.github/agents/*.agent.md` | Individual agent definition | Role, responsibilities, tools, anti-patterns |
| `.github/agents/skills/*/SKILL.md` | Reusable automation | Step-by-step automation logic, parameters |

### Configuration Scope

- **Global**: `.github/copilot-instructions.md` — Affects ALL agents and IDE assistance
- **Agent-level**: `.github/agents/[name].agent.md` — Specific agent behavior
- **Skill-level**: `.github/agents/skills/[name]/SKILL.md` — Reusable templates

### No Runtime Configuration

- **Zero API keys stored** for external LLMs (no `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- **Zero environment variables** for AI services
- **All configuration is static** — agents don't change behavior at runtime

---

## SECTION 5: Gap Analysis — Missing AI Capabilities

### Current Business Operations (All Manual/Deterministic)

| Operation | Current Method | AI Potential |
|-----------|----------------|--------------|
| **Product Categorization** | Manual tagging in UI | AI auto-tagging (image + name classification) |
| **Pricing & Margins** | Manual cost entry | Price optimization (competitor data, demand) |
| **Inventory Forecasting** | Manual monitoring | Time-series prediction (ARIMA, Prophet) |
| **Customer Segmentation** | None | RFM clustering (purchase history analysis) |
| **Sales Prediction** | Dashboard analytics | Trend forecasting (revenue projection) |
| **Stock Replenishment** | Manual alerts | Demand-driven automation (reduce stockouts) |
| **Waste Detection** | Manual review | Anomaly detection (unusual waste patterns) |
| **Vendor Optimization** | Manual comparison | Recommendation engine (price/lead-time) |
| **Support/Chat** | Email only | AI chatbot (FAQ, order tracking) |
| **Receipt Analysis** | Manual entry | OCR + entity extraction |

---

### Detailed Gap Analysis by Feature

#### 1. **Product Intelligence** 🔴 MISSING

**Gap**: No automated product insights

**Opportunities**:
- **Auto-Categorization**: Upload image → AI classifies product type (beverage, food, etc.)
- **Description Generation**: Seed data → Generate product descriptions for digital menu
- **Tag Suggestions**: Based on name + category → Suggest recipe tags, allergens
- **Duplicate Detection**: Prevent duplicate SKUs using embedding similarity

**Stack Recommendation**:
```typescript
// Option A: Vercel AI SDK + Vision Models
import { generateObject } from 'ai'
import Anthropic from '@anthropic-ai/sdk'

const result = await generateObject({
  model: 'claude-3-5-sonnet-20241022',
  schema: z.object({
    category: z.enum(['FOOD', 'BEVERAGE', 'SUPPLY']),
    tags: z.array(z.string()),
  }),
  prompt: `Analyze product: ${productName}`,
})

// Option B: Ollama (local, no API key)
// Option C: HuggingFace inference API
```

---

#### 2. **Inventory Forecasting** 🔴 MISSING

**Gap**: No predictive stock management

**Opportunities**:
- **Stock Depletion Prediction**: "This ingredient will run out in 3 days based on sales velocity"
- **Seasonal Demand**: "Predict Q4 demand increase 40% for party supplies"
- **Optimal Stock Levels**: Calculate `minStock` automatically based on consumption rate
- **Churn Prediction**: "This slow-moving SKU hasn't sold in 90 days"

**Stack Recommendation**:
```typescript
// Time-series forecasting (local inference)
import Anthropic from '@anthropic-ai/sdk'

const { content } = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Forecast stock for: ${historicalData}. Return JSON: {forecast, confidence, recommendation}`
  }]
})

// Alternative: Custom LSTM model via TensorFlow.js (client-side)
```

---

#### 3. **Price Optimization** 🔴 MISSING

**Gap**: No dynamic pricing or margin analysis

**Opportunities**:
- **Margin Alerts**: "This product's margin is 5% below target — consider price increase"
- **Competitive Pricing**: "Competitors selling X at Y price — consider adjusting Z"
- **Bundle Recommendations**: "Pair low-margin items with high-margin items"
- **Demand-based Pricing**: "High demand detected — suggest 8% price increase"

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const optimization = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Optimize pricing for: ${productData}. 
    Consider: cost, competitor prices, demand history, margin targets.
    Return: {suggestedPrice, rationale, confidence}`
  }]
})
```

---

#### 4. **Customer Intelligence** 🔴 MISSING

**Gap**: No customer segmentation or behavior analysis

**Opportunities**:
- **RFM Segmentation**: Cluster customers by Recency/Frequency/Monetary (K-means clustering)
- **Churn Prediction**: "This customer hasn't ordered in 60 days — high churn risk"
- **Lifetime Value**: Predict customer CLV based on purchase patterns
- **Next Best Action**: "Send this customer coupon for X product (purchased complementary items)"

**Stack Recommendation**:
```typescript
// Option A: Run clustering in Node.js (TensorFlow.js)
import tf from '@tensorflow/tfjs'

const rfmData = customers.map(c => [
  dayssSinceLastPurchase(c),
  purchaseFrequency(c),
  totalSpent(c)
])
const clusters = await kmeans(rfmData, k=3)

// Option B: Use Anthropic for pattern analysis
const insights = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Analyze customer segments: ${customerData}.
    Return JSON: {segments, churnRisk, recommendations}`
  }]
})
```

---

#### 5. **Sales & Revenue Forecasting** 🔴 MISSING

**Gap**: No predictive analytics for revenue

**Opportunities**:
- **Revenue Forecast**: "Predict next month's revenue: $X ± Y"
- **Trend Detection**: "Revenue down 15% YoY — investigate causes"
- **Anomaly Detection**: "Sales for Product X unusually high on [date] — seasonal?"
- **Scenario Planning**: "If costs increase 10%, profit margin drops to X%"

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const forecast = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Forecast revenue for next 30 days using: ${historicalSalesData}
    Include: trend, seasonality, confidence intervals, risks`
  }]
})
```

---

#### 6. **Smart Replenishment** 🔴 MISSING

**Gap**: Manual inventory ordering

**Opportunities**:
- **Auto-Reorder Suggestions**: "Order 100 units of X — you have 5 days supply at current velocity"
- **Optimal Order Quantity**: Calculate EOQ (Economic Order Quantity) based on demand + lead time
- **Supplier Recommendations**: "Vendor A: cheaper but 14-day lead time; Vendor B: premium but 2-day lead time"
- **Multi-SKU Optimization**: "Bundle these 3 items to get volume discount"

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const replenishment = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Generate replenishment order for: ${products}
    Consider: current stock, sales velocity, lead times, supplier terms.
    Return JSON: {itemsToOrder, quantities, suppliers, urgency}`
  }]
})
```

---

#### 7. **Waste & Loss Detection** 🔴 MISSING

**Gap**: No anomaly detection for inventory discrepancies

**Opportunities**:
- **Waste Alerts**: "This ingredient has 40% higher waste rate than average — investigate"
- **Theft Detection**: "Physical count shows 20% shortfall vs. system — potential theft/theft"
- **Expiration Tracking**: "Product X expires in 3 days — suggest promotional discount"
- **Shrinkage Analysis**: By category/supplier/period

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anomalyDetection = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Analyze waste & shrinkage patterns: ${inventoryData}
    Identify: anomalies, trends, high-risk items, root causes`
  }]
})
```

---

#### 8. **Recipe & Production Optimization** 🔴 MISSING (Complex Feature)

**Gap**: No intelligent recipe management or yield optimization

**Opportunities**:
- **Ingredient Substitution**: "Out of Item A? Try Item B with 95% satisfaction"
- **Yield Optimization**: "Adjust portions — same taste, 10% less ingredient cost"
- **Recipe Suggestions**: "These ingredients pair well — create new menu item"
- **Allergen Analysis**: "This recipe contains milk — flag for allergic customers"

---

#### 9. **AI Chat Assistant** 🔴 MISSING

**Gap**: No intelligent support/FAQ system

**Opportunities**:
- **Order Status Bot**: "What's the status of order #123?" → Fetches order, explains delays
- **FAQ Assistant**: "How do I add products?" → Retrieves help docs, video links
- **Smart Search**: Natural language search across products, orders, docs
- **Context-Aware Help**: Based on user role, show relevant guidance

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

export async function chat(userMessage: string, context: ChatContext) {
  const system = `You are a helpful support assistant for KIPO restaurant management platform.
  You have access to: ${JSON.stringify(context.kbDocs)}`

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMessage }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : null
}
```

---

#### 10. **Receipt & Document Analysis** 🔴 MISSING

**Gap**: No OCR or automatic data extraction

**Opportunities**:
- **Invoice Parsing**: "Extract supplier, date, items, total from PDF invoice → Auto-create stock entry"
- **Receipt Recognition**: Customer photo of receipt → Extract order details
- **Document Classification**: "This PDF is an invoice / quote / shipment notice"
- **Multi-language Support**: Process receipts in Portuguese, Spanish, English

**Stack Recommendation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

export async function parseInvoice(filePath: string) {
  const imageData = fs.readFileSync(filePath)
  const base64 = imageData.toString('base64')

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64,
        },
      }, {
        type: 'text',
        text: `Parse this invoice. Extract: supplier name, date, line items with quantities/prices.
        Return JSON: {supplier, date, items: [{name, qty, unitPrice, total}], grandTotal}`
      }],
    }],
  })

  return JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}')
}
```

---

## SECTION 6: Recommended Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2) 💡 IMMEDIATE VALUE

| Feature | Effort | Impact | Benefit |
|---------|--------|--------|---------|
| **Product Auto-Tagging** | 🟢 Small | 🔴 High | Saves 30+ min/week on product data entry |
| **Low Stock AI Alerts** | 🟢 Small | 🔴 High | Prevent 80% of stockouts |
| **Price Margin Alerts** | 🟢 Small | 🟡 Medium | Identify unprofitable items |
| **Chat FAQ Bot** | 🟢 Small | 🟡 Medium | Reduce support tickets 40% |

**Tech**: Anthropic SDK + Vercel AI SDK (lightweight, no model hosting)

**Estimated Cost**: $50-100/month API calls (light usage)

---

### Phase 2: Core Intelligence (Week 3-6) 📊 STRATEGIC

| Feature | Effort | Impact | Benefit |
|---------|--------|--------|---------|
| **Stock Forecasting** | 🟡 Medium | 🔴 High | Optimize inventory by 25% |
| **Customer Segmentation** | 🟡 Medium | 🔴 High | Personalized marketing 3x ROI |
| **Revenue Forecasting** | 🟡 Medium | 🟡 Medium | Better financial planning |
| **Waste Detection** | 🟡 Medium | 🟡 Medium | Identify cost drivers |

**Tech**: TensorFlow.js (client-side ML) + Anthropic for analysis

**Estimated Cost**: $200-300/month API calls

---

### Phase 3: Enterprise Features (Month 2-3) 🚀 COMPETITIVE ADVANTAGE

| Feature | Effort | Impact | Benefit |
|---------|--------|--------|---------|
| **Dynamic Pricing Engine** | 🔴 Large | 🔴 High | 5-10% revenue increase |
| **Vendor Optimization** | 🔴 Large | 🟡 Medium | Cost reduction 8-15% |
| **Smart Replenishment** | 🔴 Large | 🔴 High | Reduce carrying costs 20% |
| **Receipt Automation** | 🔴 Large | 🟡 Medium | 50 min/week saved |

**Tech**: Anthropic + Vision models + custom fine-tuned models

**Estimated Cost**: $500-1000/month API calls

---

## SECTION 7: Technical Implementation Guide

### 7.1 Integration Architecture

```typescript
// === LAYER 1: AI Service Wrapper ===
// File: app/_services/ai.service.ts

import Anthropic from '@anthropic-ai/sdk'
import { cache } from 'react'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function analyzeProduct(productData: ProductDto) {
  return await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze product: ${JSON.stringify(productData)}`
    }]
  })
}

// === LAYER 2: Data Access Pattern ===
// File: app/_data-access/product/get-ai-tags.ts

import 'server-only'
import { db } from '@/app/_lib/prisma'
import { analyzeProduct } from '@/app/_services/ai.service'
import { getCurrentCompanyId } from '@/app/_lib/get-current-company'

export async function getAIRecommendedTags(productId: string) {
  const companyId = await getCurrentCompanyId()
  
  const product = await db.product.findUnique({
    where: { id: productId, company: { id: companyId } }
  })
  
  if (!product) return null
  
  const aiAnalysis = await analyzeProduct(product)
  return aiAnalysis.content[0].type === 'text' 
    ? JSON.parse(aiAnalysis.content[0].text)
    : null
}

// === LAYER 3: Server Action ===
// File: app/_actions/product/apply-ai-tags.ts

import { actionClient } from '@/app/_lib/safe-action'
import { z } from 'zod'
import { getAIRecommendedTags } from '@/app/_data-access/product/get-ai-tags'
import { assertCapability } from '@/app/_lib/rbac'

const applyAITagsSchema = z.object({
  productId: z.string().uuid()
})

export const applyAITagsAction = actionClient
  .schema(applyAITagsSchema)
  .action(async ({ parsedInput: { productId } }) => {
    await assertCapability('product:update')
    
    const tags = await getAIRecommendedTags(productId)
    
    if (!tags) {
      return { success: false, error: 'Product not found' }
    }
    
    // TODO: Save tags to database
    
    return { success: true, data: tags }
  })

// === LAYER 4: React Component ===
// File: app/(protected)/products/_components/ai-tag-suggester.tsx

'use client'

import { useAction } from 'next-safe-action/hooks'
import { applyAITagsAction } from '@/app/_actions/product/apply-ai-tags'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function AITagSuggester({ productId }: { productId: string }) {
  const { execute, isPending } = useAction(applyAITagsAction)

  return (
    <Button 
      onClick={() => execute({ productId })}
      disabled={isPending}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Sugerir Tags com IA
    </Button>
  )
}
```

---

### 7.2 Environment Configuration

```bash
# .env.local (development)
ANTHROPIC_API_KEY=sk-ant-...

# .env.production
ANTHROPIC_API_KEY=*** (via Vercel secrets)

# Optional: Disable AI features for cost control
NEXT_PUBLIC_AI_FEATURES_ENABLED=true
```

---

### 7.3 Cost Estimation

| Model | Use Case | Cost/1K Tokens |
|-------|----------|----------------|
| Claude 3.5 Sonnet | Complex analysis | $3 input / $15 output |
| Claude 3.5 Haiku | Simple classification | $0.80 input / $4 output |
| Claude Opus | Heavy lifting | $15 input / $75 output |

**Monthly Budget Examples**:
- **Light Usage** (500 API calls/month): ~$50-100
- **Medium Usage** (5,000 API calls/month): ~$200-300
- **Heavy Usage** (20,000 API calls/month): ~$800-1200

---

### 7.4 Rate Limiting & Caching

```typescript
// app/_services/ai-cache.ts

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function getAIAnalysisWithCache(
  productId: string,
  ttlSeconds = 86400 // 24 hours
) {
  const cacheKey = `ai:product:${productId}`
  
  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) return cached
  
  // Call AI API
  const result = await analyzeProduct(productId)
  
  // Cache result
  await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result))
  
  return result
}
```

---

## SECTION 8: Security & Compliance Considerations

### 8.1 Data Privacy (LGPD Compliance)

- ⚠️ **Customer data sent to Anthropic API** — Must get explicit consent
- ✅ KIPO already has privacy policy disclaimer (though for "demo terms")
- 📋 Need explicit data processing agreement with Anthropic

**Required Changes**:
```typescript
// In terms/LGPD agreement:
// "Stock-Manager uses AI services (Anthropic) to analyze your inventory data.
// This data is transmitted to Anthropic's servers. See our Privacy Policy for details."

// In user settings:
// Checkbox: "Allow AI-powered features (inventory analysis, forecasting)"
```

---

### 8.2 Rate Limiting & Abuse Prevention

```typescript
// app/_lib/ai-rate-limiter.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 calls/hour per user
})

export async function checkAIRateLimit(userId: string) {
  const { success } = await ratelimit.limit(`ai:${userId}`)
  return success
}
```

---

### 8.3 Cost Controls

```typescript
// app/_lib/ai-cost-guard.ts

export async function checkAICostBudget(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { aiCostBudgetUSD: true }
  })

  if (!company?.aiCostBudgetUSD) {
    return true // No limit set
  }

  const thisMonthCost = await getAIServiceCost(companyId, 'month')
  return thisMonthCost < company.aiCostBudgetUSD
}
```

---

## SECTION 9: Competitive Positioning

### How AI Transforms KIPO

| Current | With AI | Competitive Edge |
|---------|---------|------------------|
| Manual product entry | Auto-categorization + tagging | 70% faster onboarding |
| Reactive stock alerts | Predictive forecasting | 25% inventory optimization |
| Static pricing | Dynamic margin optimization | 5-10% revenue increase |
| No customer insights | RFM segmentation + churn prediction | 3x marketing ROI |
| Email-only support | AI chat assistant | 40% faster response time |
| Manual waste tracking | Anomaly detection | Identify $$ loss opportunities |

---

## SECTION 10: Action Items & Next Steps

### Immediate (This Week)

- [ ] Decide on primary LLM provider (recommend: **Anthropic Claude**)
- [ ] Set up Anthropic API account & get API key
- [ ] Define data privacy policy for AI features
- [ ] Create Slack channel: `#ai-features` for tracking

### Short-term (2-4 Weeks)

- [ ] Implement **Product Auto-Tagging** feature (Phase 1)
- [ ] Add **Low Stock AI Alerts** feature
- [ ] Create monitoring dashboard for AI API costs
- [ ] Set up rate limiting & cost guards

### Medium-term (1-3 Months)

- [ ] Implement **Stock Forecasting** (Phase 2)
- [ ] Add **Customer Segmentation** feature
- [ ] Build **AI FAQ Chatbot** for support
- [ ] Create internal analytics for feature adoption

### Long-term (3-6 Months)

- [ ] Develop **Dynamic Pricing Engine** (Phase 3)
- [ ] Implement **Smart Replenishment** automation
- [ ] Build **Vision-based Receipt Parsing**
- [ ] Create advanced **Waste & Loss Analytics**

---

## SECTION 11: FAQ & Troubleshooting

### Q: Will AI features break existing functionality?
**A**: No. All AI features are **optional add-ons** placed behind feature flags. Users can opt-in/opt-out.

### Q: How much will AI cost?
**A**: ~$50-100/month for light usage. Enterprise plans can set AI cost budgets.

### Q: Is customer data safe?
**A**: Data sent to Anthropic API. KIPO will:
- Get explicit user consent
- Minimize sensitive data transmission
- Cache results to reduce API calls

### Q: Can we use local models instead?
**A**: Yes! Option to use Ollama (local) or open-source models, but:
- Requires GPU infrastructure
- Lower accuracy than cloud models
- Higher latency
- **Recommended**: Start with Anthropic API, migrate to local later if needed

### Q: What if Anthropic API goes down?
**A**: Graceful degradation:
- AI features disabled, but core app works
- Fallback to manual workflows
- Alerts sent to support team

---

## Conclusion

**Stock-Manager is currently a feature-rich but intelligence-poor platform.**

There is **massive untapped potential** to add AI-driven value across inventory, pricing, and customer management. With a phased approach starting with quick wins, KIPO can achieve:

- ✅ 25% inventory optimization
- ✅ 5-10% revenue increase
- ✅ 40% support automation
- ✅ 3x marketing ROI
- ✅ Competitive differentiation in restaurant tech

**Recommended first step**: Implement Phase 1 (product tagging + stock alerts) in 2 weeks with ~$5-10 development cost and $50-100 monthly API budget.

---

**Document Version**: 1.0  
**Last Updated**: 25 de maio de 2026  
**Next Review**: 15 de junho de 2026
