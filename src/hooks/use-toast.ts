"use client"

import * as React from "react"

export type ToastVariant = "default" | "destructive"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [...state.toasts, action.toast] }
    case "REMOVE_TOAST":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

type Listener = () => void
let listeners: Listener[] = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((l) => l())
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

function toast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2)
  const duration = options.duration ?? 4000

  dispatch({ type: "ADD_TOAST", toast: { id, ...options } })

  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", id })
  }, duration)
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    function listener() {
      setState({ ...memoryState })
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    toast,
    toasts: state.toasts,
    dismiss: (id: string) => dispatch({ type: "REMOVE_TOAST", id }),
  }
}

export { toast, useToast }
