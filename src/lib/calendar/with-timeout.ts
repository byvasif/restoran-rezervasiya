/**
 * Xarici API çağırışını vaxt həddinə salır. Google cavab verməsə, rezervasiya
 * səhifəsi sonsuz gözləməməli, anlaşılan davranışa keçməlidir.
 */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} ${ms} ms ərzində cavab vermədi`)
    this.name = 'TimeoutError'
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}
