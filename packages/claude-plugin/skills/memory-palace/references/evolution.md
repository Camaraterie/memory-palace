# Engram Evolution System

Engram is the TypeScript-based protocol evolution harness. It mutates `protocol.md`, evaluates mutations against behavioral test cases, and keeps or discards changes based on variance-aware scoring.

## Evolution Cycle

1. **Read** current `protocol.md`
2. **Baseline** score via eval harness
3. **Propose** mutation (small, targeted change to phrasing/structure/emphasis)
4. **Validate** mutation (syntax, line count ≤ 200, protected sections intact)
5. **Evaluate** mutated protocol against eval cases
6. **Compare** scores with variance penalty
7. **Keep or discard** based on `min_improvement` threshold (0.01)
8. **Sync** if kept — update CLAUDE.md in consuming projects

## Key Types

- `EvolutionStage`: protocol | program | evals | templates | meta
- `WeaknessCategory`: tool_gap | case_ambiguity | time_exhaustion | score_regression | high_variance | stagnation | anti_pattern
- `Experiment`: Contains score_before, score_after, eval_repeats, score_mean, score_std, variance_penalty, adjusted_score

## Eval Cases

Each eval case is a TypeScript class extending `TypedEvalCase`:

- `name`, `category`, `complexity`, `priority`
- `available_tools`: tools the simulated agent can use
- `max_turns`: turn budget for the eval
- `getExpectedBehaviors()`: what the agent SHOULD do
- `getAntiBehaviors()`: what the agent should NOT do
- `getSuccessCriteria()`: binary pass/fail conditions
- `buildContext(palace)`: dynamic context from real palace data

Example: `UsesContextOnStartup` tests that agents call recall/search before planning work.

## Mutation Strategy (from program.md)

- Small, targeted changes to phrasing, structure, or emphasis
- Try reordering instructions to test priority sensitivity
- Try adding/removing examples
- Try different levels of specificity vs generality
- Try imperative vs descriptive tone
- Never exceed 200 lines — brevity valued, more detail allowed

## Protected Sections (Do Not Mutate)

- **"On Session End"**: 5/5 mutation attempts regressed scores (range: -0.006 to -0.241)
- **"Available Tools"**: Reference section, not behavioral guidance

## Anti-Patterns to Avoid

- Vague instructions ("use memory when appropriate")
- Redundant phrasing wasting line budget
- Over-specifying tool syntax (agents know their tools)
- Instructions assuming a specific agent (must work for any agent)

## Weakness Analysis

The `analyzeExperiments` function detects:
- **Tool gaps**: Agent mentions tools it doesn't have
- **Time exhaustion**: Agent started but ran out of turns
- **Score regression**: Mutation caused score drop > 0.15
- **Stagnation**: Last 5 cycles within 0.1 range, all below 0.8
- **Anti-patterns**: Recurring anti-behaviors across cases

## Configuration (engram.config.yaml)

- LLM: LM Studio at `172.29.160.1:1234`, model `qwen3.5-9b`
- Agent: `anthropic/claude-sonnet-4-20250514` for eval sessions
- Evolution: `min_improvement: 0.01`, `eval_repeats: 1`, `stability_penalty_weight: 0.25`
- Mempalace: test_guest_key for isolated eval palace
