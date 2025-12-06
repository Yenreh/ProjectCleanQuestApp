/**
 * Database Layer - Main Entry Point
 * 
 * This file re-exports everything from the modular db structure
 * to maintain backward compatibility with existing imports.
 * 
 * Old monolithic db.ts has been moved to db_old.ts
 * New modular structure is in db/ directory
 */

export { supabase } from './db/client'
export { db } from './db/index'
export * from './db/utils'
export type { ChallengeTemplate, ActiveChallenge, ChallengeProgress } from './db/challenges'
