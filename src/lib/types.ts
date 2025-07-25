export interface QuestionContentText {
  type: 'text'
  value: string
}

export interface QuestionContentBlank {
  type: 'blank'
  id: string
  answers: string[]
  placeholder: string
}

export type QuestionContent = QuestionContentText | QuestionContentBlank

export interface Question {
  id: string
  questionNumber: number
  content: QuestionContent[]
}

export interface Section {
  id: string
  title: string
  questions: Question[]
}

export interface Topic {
  slug: string
  title: string
  description: string
  sections: Section[]
}