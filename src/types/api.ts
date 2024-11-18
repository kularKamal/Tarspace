export type CustomersApiResponse = Array<{
  name: string
  id: string
  number_of_projects: number
}>

export type UserSession = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}
