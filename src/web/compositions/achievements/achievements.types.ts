export interface Achievement {
  icon: string
  title: string
  description: string
  color: string
  total?: number
  amount?: number
  completed: boolean
  active: boolean
}

export interface AchievementTree {
  title: string
  achievements: Achievement[]
}