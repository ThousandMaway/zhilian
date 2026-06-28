export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  QuestionsTab: undefined;
  PracticeTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  PracticeResult: { recordId?: string; total?: number; correct?: number; timeSpent?: number; mode?: string };
};

export type QuestionsStackParamList = {
  QuestionList: undefined;
  QuestionDetail: { questionId?: string };
  QuestionEdit: { questionId?: string; tagId?: string };
  ImportQuestions: undefined;
};

export type PracticeStackParamList = {
  PracticeConfig: undefined;
  RandomConfig: undefined;
  LibrarySelect: undefined;
  PaperList: undefined;
  PaperEdit: { paperId?: string };
  PracticeQuiz: { mode: string; questionIds?: string[] };
  PracticeResult: { total: number; correct: number; timeSpent: number; mode?: string };
  PracticeFavorites: undefined;
  PracticeWrongQuestions: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  WrongQuestions: undefined;
  Favorites: undefined;
  CheckinHistory: undefined;
  Statistics: undefined;
  Settings: undefined;
};
