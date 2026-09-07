export type DebouncedSingleFlight = {
  schedule: () => void
  cancel: () => void
  pending: () => boolean
}

export function createDebouncedSingleFlight(
  task: () => Promise<void>,
  delay: number,
  onError: (error: unknown) => void,
): DebouncedSingleFlight {
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let queued = false

  const run = async (): Promise<void> => {
    if (running) {
      queued = true
      return
    }

    running = true
    try {
      while (true) {
        queued = false
        await task()
        if (!queued) {
          break
        }
      }
    } catch (error) {
      onError(error)
    } finally {
      running = false
      if (queued) {
        queued = false
        void run()
      }
    }
  }

  return {
    schedule: () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        void run()
      }, delay)
    },
    cancel: () => {
      clearTimeout(timer)
      timer = undefined
    },
    pending: () => running || queued || timer != null,
  }
}
