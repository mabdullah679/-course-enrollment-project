// Simple event emitter for future dashboard notifications
// Scaffold for "EnrollmentRejected" and other events

interface EventData {
  type: string
  payload: any
  timestamp: Date
}

class EventEmitter {
  private listeners: Map<string, Array<(data: EventData) => void>> = new Map()

  // Subscribe to an event type
  on(eventType: string, callback: (data: EventData) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)
  }

  // Unsubscribe from an event type
  off(eventType: string, callback: (data: EventData) => void) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Emit an event
  emit(eventType: string, payload: any) {
    const eventData: EventData = {
      type: eventType,
      payload,
      timestamp: new Date()
    }

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(eventData)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }

    // For development, log all events
    if (import.meta.env.DEV) {
      console.log(`📢 Event emitted: ${eventType}`, eventData)
    }
  }

  // Get current listeners count for debugging
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.length || 0
    }
    return Array.from(this.listeners.values()).reduce((total, listeners) => total + listeners.length, 0)
  }
}

// Global instance for the app
export const eventEmitter = new EventEmitter()

// Convenience functions for common events
export const notifications = {
  enrollmentRejected: (enrollmentId: number, studentName: string, courseName: string) => {
    eventEmitter.emit('EnrollmentRejected', {
      enrollmentId,
      studentName,
      courseName,
      message: `Enrollment rejected for ${studentName} in ${courseName}`
    })
  },

  enrollmentApproved: (enrollmentId: number, studentName: string, courseName: string) => {
    eventEmitter.emit('EnrollmentApproved', {
      enrollmentId,
      studentName,
      courseName,
      message: `Enrollment approved for ${studentName} in ${courseName}`
    })
  },

  userStatusChanged: (userId: number, userName: string, action: string) => {
    eventEmitter.emit('UserStatusChanged', {
      userId,
      userName,
      action,
      message: `User ${userName}: ${action}`
    })
  }
}

export default eventEmitter