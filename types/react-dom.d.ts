declare module "react-dom" {
  export type FormStatus = {
    pending: boolean;
    data: FormData | null;
    method: string | null;
    action: string | ((formData: FormData) => void | Promise<void>) | null;
  };

  export function useFormStatus(): FormStatus;
}
