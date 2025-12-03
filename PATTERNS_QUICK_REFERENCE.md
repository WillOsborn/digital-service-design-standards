# Service Patterns - Quick Reference Card

## 🎯 What Are Service Patterns?

**Reusable journey components that automatically adapt based on persona characteristics and context.**

Think of patterns as smart templates that change their behavior based on who's using them.

---

## 📁 File Locations

```
schemas/v1.0.0/
├── patterns/pattern-schema.json          # Schema definition
├── examples/patterns/
│   └── update-profile-pattern.json       # Full example
├── examples/journeys/
│   └── journey-with-pattern-integration.json  # Usage example
└── documentation/patterns/
    └── implementation-guide.md           # Complete guide
```

**Main Summary**: `schemas/SERVICE_PATTERNS_SUMMARY.md`

---

## 🏗️ Pattern Anatomy (5 Core Sections)

### 1. **pattern_info**
```json
{
  "pattern_id": "update_profile_information",
  "pattern_name": "Update Profile Information",
  "version": "1.0.0",
  "category": "profile_management"
}
```

### 2. **applicability**
```json
{
  "persona_types": ["business", "consumer", "employee"],
  "experience_levels": ["beginner", "intermediate", "advanced", "expert"],
  "contexts": ["routine_maintenance", "compliance_required"]
}
```

### 3. **base_pattern**
```json
{
  "steps": [
    {
      "step_id": "access_profile",
      "step_name": "Access Profile Settings",
      "step_type": "action",
      "lane_content": { /* standard content */ }
    }
  ]
}
```

### 4. **variations**
```json
[
  {
    "variation_id": "consumer_persona_phone",
    "conditions": {
      "persona_attributes": {
        "preferred_channels": ["phone"],
        "barriers": ["technology"]
      }
    },
    "modifications": {
      "add_steps": [],
      "modify_steps": [],
      "substitute_channels": []
    }
  }
]
```

### 5. **validation**
```json
{
  "research_sources": [
    {"source": "User testing", "type": "user_testing", "confidence": "high"}
  ],
  "usage_metrics": {
    "success_rate": 0.87,
    "user_satisfaction": 3.6
  }
}
```

---

## 🔄 Pattern Categories

| **Category** | **Examples** | **Use When** |
|--------------|--------------|--------------|
| authentication | Login, 2FA, password reset | User identity verification |
| profile_management | Update info, preferences | Profile modifications |
| payment | Checkout, refund | Financial transactions |
| support | Contact help, live chat | User assistance |
| onboarding | Account setup, verification | New user activation |
| communication | Notifications, messaging | User communication |
| reporting | Generate reports, analytics | Data access |
| approval | Submit for review, workflow | Authorization processes |

---

## 🎭 Persona-Pattern Matching

### **Business Personas:**
- **Advanced + Digital** → Streamlined, bulk operations, keyboard shortcuts
- **Beginner + Digital** → Guided workflows, help text, tooltips
- **Any + Compliance** → Audit trails, approval workflows, validation

### **Consumer Personas:**
- **Any + Phone Preference** → Human-assisted, step-by-step guidance
- **Advanced + Mobile** → Touch-optimized, minimal steps
- **Beginner + Technology Barrier** → Extra support, simplified interface

### **Employee Personas:**
- **New Employee** → Onboarding integration, training resources
- **Power User** → Advanced features, customization options
- **Occasional User** → Contextual help, error prevention

---

## 📊 When to Create a Pattern

### **✅ Create Pattern When:**
- Interaction appears in **3+ journeys**
- **Systematic variations** exist across personas (not one-off)
- Benefits from **consistency and reuse**
- **Evidence-based** (research, analytics, testing)

### **❌ Don't Create Pattern When:**
- Used only 1-2 times
- Variations are completely unique (no patterns)
- Too simple (1-2 steps)
- No persona differences in behavior

---

## 🚀 Quick Start (30 Minutes)

### **Step 1: Identify** (10 min)
```
Pattern Name: _________________
Used in ___ journeys
Persona variations: Yes / No
```

### **Step 2: Base Pattern** (10 min)
```json
{
  "pattern_info": { /* identification */ },
  "base_pattern": {
    "steps": [ /* 3-10 steps */ ]
  }
}
```

### **Step 3: Add Variations** (10 min)
```json
"variations": [
  {
    "variation_id": "persona_type_channel",
    "conditions": { /* when to use */ },
    "modifications": { /* what changes */ }
  }
]
```

---

## 🔍 Pattern Selection Decision Tree

```
Is interaction used 3+ times?
├── No → Create custom steps
└── Yes ↓

Do personas interact differently?
├── No → Use simple reusable component
└── Yes ↓

Are variations systematic?
├── No → Use base pattern with minor customization
└── Yes ↓

Is complexity sufficient?
├── No → Keep as shared component
└── Yes → CREATE FULL PATTERN
```

---

## 📈 Success Metrics

| **Metric** | **Target** | **Measure** |
|------------|-----------|-------------|
| Journey Creation Time | -85% | Hours per journey |
| Success Rate | 85%+ | % completing flow |
| User Satisfaction | 4.0+ | Rating 1-5 |
| Pattern Reuse | 80%+ | % steps using patterns |
| Time Savings | 50+ hrs/month | Cumulative savings |

---

## 🛠️ Integration Example

```json
"phases": [
  {
    "pattern_instances": [
      {
        "pattern_id": "update_profile_information",
        "variation_selected": "consumer_persona_phone",
        "selection_rationale": "Phone preference + technology barriers",
        "customizations": {
          "step_id": {
            "lane_content_additions": { /* domain specifics */ }
          }
        }
      }
    ]
  }
]
```

---

## 🎯 Variation Modification Types

### **add_steps**
Insert new steps at specific positions
```json
{
  "step_id": "new_step",
  "insert_after": "existing_step_id",
  "lane_content": { /* step content */ }
}
```

### **modify_steps**
Change existing step content/duration
```json
{
  "step_id": "existing_step",
  "lane_content_overrides": { /* new content */ },
  "duration_multiplier": 2.0
}
```

### **remove_steps**
Remove optional steps
```json
["step_id_to_remove"]
```

### **substitute_channels**
Swap interaction channels
```json
{
  "from_channel": "self_service_web",
  "to_channel": "assisted_phone",
  "reason": "Technology barrier"
}
```

---

## ⚠️ Common Mistakes

| **Mistake** | **Impact** | **Solution** |
|-------------|------------|--------------|
| Creating patterns for 1-2 uses | Wasted effort | Apply 3+ rule |
| Assuming persona behavior | Poor fit | Base on research |
| Making patterns too rigid | Low adoption | Add customization points |
| No validation metrics | Can't improve | Track usage data |
| Skipping variations | Misses persona needs | Create 2+ variations |

---

## 📚 Key Resources

- **Full Guide**: `SERVICE_PATTERNS_SUMMARY.md`
- **Implementation**: `documentation/patterns/implementation-guide.md`
- **Example Pattern**: `examples/patterns/update-profile-pattern.json`
- **Integration Example**: `examples/journeys/journey-with-pattern-integration.json`

---

## 💡 Pro Tips

1. **Start small**: Create 1 pattern, use in 3 journeys, measure impact
2. **Use examples**: Copy and modify update-profile-pattern.json structure
3. **Test variations**: Validate persona-variation matches with real users
4. **Track metrics**: Monitor success rate, completion time, satisfaction
5. **Iterate fast**: Update patterns based on performance data

---

## 🎓 Next Steps

1. ✅ Review example pattern: `update-profile-pattern.json`
2. ✅ Identify first pattern candidate from current work
3. ✅ Create base pattern with 3-5 steps
4. ✅ Add 2 persona variations
5. ✅ Test integration in one journey
6. ✅ Measure and iterate

---

**Remember**: Patterns save time, improve consistency, and enable persona-aware design. Your first pattern is waiting to be discovered in your existing work.

**Version**: 1.0.0 | **Updated**: October 4, 2025
