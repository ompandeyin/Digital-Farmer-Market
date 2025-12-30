/**
 * Scheduler for Auto-Confirming Deliveries
 * 
 * This module sets up a periodic job to automatically confirm deliveries
 * that have passed their auto-confirm date, releasing escrow to farmers.
 * 
 * Configuration:
 * - AUTO_CONFIRM_DAYS: Days after order before auto-confirm (default: 7)
 * - SCHEDULER_INTERVAL_HOURS: How often to run the check (default: 6 hours)
 */

import { processAutoConfirmations } from './escrowService.js'

// Configuration from environment or defaults
const SCHEDULER_CONFIG = {
  // How often to run the scheduler (in milliseconds)
  INTERVAL_MS: parseInt(process.env.SCHEDULER_INTERVAL_HOURS || 6) * 60 * 60 * 1000,
  // Whether the scheduler is enabled
  ENABLED: process.env.AUTO_CONFIRM_SCHEDULER_ENABLED !== 'false'
}

let schedulerInterval = null
let isRunning = false

/**
 * Run the auto-confirmation process
 */
const runAutoConfirmation = async () => {
  if (isRunning) {
    console.log('⏳ Auto-confirmation already running, skipping...')
    return
  }

  isRunning = true
  const startTime = Date.now()

  try {
    console.log('🔄 Starting auto-confirmation process...')
    const results = await processAutoConfirmations()
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`✅ Auto-confirmation completed in ${Date.now() - startTime}ms`)
    console.log(`   - Processed: ${results.length}`)
    console.log(`   - Successful: ${successful}`)
    console.log(`   - Failed: ${failed}`)
    
    if (failed > 0) {
      console.log('   - Failed orders:', results.filter(r => !r.success).map(r => r.orderNumber))
    }

    return results
  } catch (error) {
    console.error('❌ Auto-confirmation process failed:', error.message)
    throw error
  } finally {
    isRunning = false
  }
}

/**
 * Start the auto-confirmation scheduler
 */
export const startScheduler = () => {
  if (!SCHEDULER_CONFIG.ENABLED) {
    console.log('⏸️  Auto-confirmation scheduler is disabled')
    return
  }

  if (schedulerInterval) {
    console.log('⚠️  Scheduler already running')
    return
  }

  console.log(`📅 Starting auto-confirmation scheduler (interval: ${SCHEDULER_CONFIG.INTERVAL_MS / 1000 / 60 / 60} hours)`)
  
  // Run immediately on startup
  setTimeout(() => {
    runAutoConfirmation().catch(err => {
      console.error('Initial auto-confirmation failed:', err.message)
    })
  }, 5000) // Wait 5 seconds after server starts

  // Schedule periodic runs
  schedulerInterval = setInterval(() => {
    runAutoConfirmation().catch(err => {
      console.error('Scheduled auto-confirmation failed:', err.message)
    })
  }, SCHEDULER_CONFIG.INTERVAL_MS)

  console.log('✅ Auto-confirmation scheduler started')
}

/**
 * Stop the auto-confirmation scheduler
 */
export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('🛑 Auto-confirmation scheduler stopped')
  }
}

/**
 * Get scheduler status
 */
export const getSchedulerStatus = () => ({
  enabled: SCHEDULER_CONFIG.ENABLED,
  running: !!schedulerInterval,
  isProcessing: isRunning,
  intervalMs: SCHEDULER_CONFIG.INTERVAL_MS,
  intervalHours: SCHEDULER_CONFIG.INTERVAL_MS / 1000 / 60 / 60
})

/**
 * Manually trigger auto-confirmation (for testing/admin)
 */
export const triggerManualRun = async () => {
  return await runAutoConfirmation()
}

export default {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerManualRun
}
