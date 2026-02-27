export interface GradeItem {
  id: string
  label: string
  price: number
  prevPrice: number
  itemCode: string
  gradeName: string
  unitName: string
}

export interface TomatoSection {
  title: string
  grades: GradeItem[]
}
