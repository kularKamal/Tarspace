export function isObjectNotEmpty(obj?: object | null): boolean {
  return obj !== null && obj !== undefined && Object.keys(obj).length > 0
}
