import { Dispatch, SetStateAction, useState } from "react"
import { useDebounce } from "usehooks-ts"

export function useDebouncedState<S>(initialState: S | (() => S), delay?: number): [S, Dispatch<SetStateAction<S>>] {
  const [state, setState] = useState<S>(initialState)
  return [useDebounce<S>(state, delay), setState]
}
