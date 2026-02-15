/**
 * Game engine — backwards-compatible re-export.
 *
 * The monolithic GameEngine class has been refactored into:
 * - X01Engine (shared/engines/x01-engine.ts)
 * - CricketEngine (shared/engines/cricket-engine.ts)
 * - IGameEngine interface (shared/engines/engine-interface.ts)
 * - createEngine factory (shared/engines/engine-factory.ts)
 *
 * This file preserves the old `GameEngine` export as an alias for X01Engine
 * so that any existing imports continue to work.
 */

export { X01Engine as GameEngine } from './engines/x01-engine'
export { createEngine } from './engines/engine-factory'
export type { IGameEngine } from './engines/engine-interface'
