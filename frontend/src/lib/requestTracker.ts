// Simple request tracker for QA console
interface RequestInfo {
  id: string
  endpoint: string
  method: string
  status: number
  timestamp: Date
}

class RequestTracker {
  private requests: RequestInfo[] = []
  private maxRequests = 10

  addRequest(requestInfo: RequestInfo) {
    this.requests.unshift(requestInfo) // Add to beginning
    if (this.requests.length > this.maxRequests) {
      this.requests = this.requests.slice(0, this.maxRequests) // Keep only last 10
    }
  }

  getRequests(): RequestInfo[] {
    return [...this.requests] // Return a copy
  }

  clear() {
    this.requests = []
  }
}

export const requestTracker = new RequestTracker()
export type { RequestInfo }