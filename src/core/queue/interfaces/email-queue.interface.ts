export interface JobEmailData {
  name?: string;
  email: string;
  otpCode: string;
  mailerInput: {
    subject: string;
    template: string;
  };
}
