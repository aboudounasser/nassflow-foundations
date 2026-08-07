export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  jobTitle: string;
}

export const currentUserMock: CurrentUser = {
  id: "usr-nasser",
  name: "Nasser Aboudou",
  email: "nasser@nassflow.io",
  initials: "NA",
  jobTitle: "Fondateur",
};