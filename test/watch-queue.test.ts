import { afterEach, expect, it, vi } from 'vitest'
import { createDebouncedSingleFlight } from '../src/serve/watch-queue.js'

afterEach(() => {
  vi.useRealTimers()
})

it('createDebouncedSingleFlight coalesces bursts into one run', async () => {
  vi.useFakeTimers()
  const task = vi.fn(async () => {})
  const queue = createDebouncedSingleFlight(task, 80, () => {})

  queue.schedule()
  queue.schedule()
  queue.schedule()
  expect(task).not.toHaveBeenCalled()

  await vi.advanceTimersByTimeAsync(80)
  expect(task).toHaveBeenCalledTimes(1)
})

it('createDebouncedSingleFlight queues a follow-up while a run is in flight', async () => {
  vi.useFakeTimers()
  let release: (() => void) | undefined
  const task = vi.fn(async () => {
    await new Promise<void>((resolve) => {
      release = resolve
    })
  })
  const queue = createDebouncedSingleFlight(task, 80, () => {})

  queue.schedule()
  await vi.advanceTimersByTimeAsync(80)
  expect(task).toHaveBeenCalledTimes(1)
  expect(queue.pending()).toBe(true)

  queue.schedule()
  await vi.advanceTimersByTimeAsync(80)
  expect(task).toHaveBeenCalledTimes(1)

  release?.()
  await vi.advanceTimersByTimeAsync(0)
  expect(task).toHaveBeenCalledTimes(2)
})

it('createDebouncedSingleFlight cancel drops a pending debounce', async () => {
  vi.useFakeTimers()
  const task = vi.fn(async () => {})
  const queue = createDebouncedSingleFlight(task, 80, () => {})

  queue.schedule()
  queue.cancel()
  await vi.advanceTimersByTimeAsync(80)
  expect(task).not.toHaveBeenCalled()
})
