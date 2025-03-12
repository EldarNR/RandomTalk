export interface FormField {
  key: string;
  type: "text" | "email" | "password" | "checkbox";
  label: string;
}

export interface FormData {
  fields: FormField[];
  data: { [key: string]: string | boolean | number };
}
