export function getUserId(): number | null {
  if (typeof window === 'undefined') {
    console.log("[v0] getUserId called on server side, returning null")
    return null
  }
  
  try {
    const userIdStr = localStorage.getItem('userId')
    console.log("[v0] getUserId - retrieved from localStorage:", userIdStr)
    
    if (!userIdStr) {
      console.log("[v0] getUserId - userId not found in localStorage")
      return null
    }
    
    const userId = parseInt(userIdStr, 10)
    console.log("[v0] getUserId - parsed userId:", userId)
    
    if (isNaN(userId)) {
      console.log("[v0] getUserId - failed to parse userId")
      return null
    }
    
    return userId
  } catch (error) {
    console.error("[v0] getUserId - error accessing localStorage:", error)
    return null
  }
}

export function saveUserId(id: number | string): void {
  if (typeof window === 'undefined') {
    console.log("[v0] saveUserId called on server side, skipping")
    return
  }
  
  try {
    const idStr = String(id)
    localStorage.setItem('userId', idStr)
    console.log("[v0] saveUserId - saved userId to localStorage:", idStr)
  } catch (error) {
    console.error("[v0] saveUserId - error saving to localStorage:", error)
  }
}

export function clearUserId(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('userId')
    console.log("[v0] clearUserId - removed userId from localStorage")
  } catch (error) {
    console.error("[v0] clearUserId - error clearing localStorage:", error)
  }
}
