export * from "utils/deliverables"

export function titlecase(str: string) {
  return str
    .split(" ")
    .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ")
}
