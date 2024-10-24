import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReCAPTCHA from 'react-google-recaptcha';
import toast, { Toaster } from 'react-hot-toast';

const formSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(2),
});

type FormSchema = z.infer<typeof formSchema>;

const inputStyle = 'w-full bg-background border-b border-primary outline-none focus:text-primary focus:border-primary py-2.5';

const errorStyle = 'text-sm md:text-lg text-red-600 mt-2';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [firstRender, setFirstRender] = useState(true);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormSchema) => {
    setLoading(true);
    const token = await recaptchaRef.current?.executeAsync().catch(() => {
      setLoading(false);
      toast.error('Potwierdzenie, że nie jesteś robotem nie udało się.');
    });

    if (!token) {
      setLoading(false);
      toast.error('Potwierdzenie, że nie jesteś robotem nie udało się.');
      return;
    }

    const sendMail = async () => {
      const res = await fetch(`${import.meta.env.PUBLIC_API}/api/send-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          mail: data.email,
          phone: data.phone,
          content: data.message,
          token,
        }),
      });
      return new Promise<void>((resolve, reject) => {
        if (res.status === 200) resolve();
        else reject();
      });
    };

    toast
      .promise(sendMail(), {
        loading: 'Wysyłanie... To może chwilę potrwać.',
        success: 'Wiadomość została wysłana!',
        error: 'Coś poszło nie tak, prosimy spróbować później.',
      })
      .then(() => {
        reset();
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setFirstRender(false);
  }, []);

  return (
    <>
      <Toaster />
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 text-sm md:space-y-10 md:text-[28px] md:leading-tight">
        <div>
          <input {...register('firstName')} placeholder="Imię*" className={inputStyle} />
          {errors.firstName && <p className={errorStyle}>Nieprawidłowe imię</p>}
        </div>
        <div>
          <input {...register('lastName')} placeholder="Nazwisko*" className={inputStyle} />
          {errors.lastName && <p className={errorStyle}>Nieprawidłowe nazwisko</p>}
        </div>
        <div>
          <input {...register('email')} placeholder="Adres Email*" className={inputStyle} />
          {errors.email && <p className={errorStyle}>Nieprawidłowy adres email</p>}
        </div>
        <div>
          <input {...register('phone')} placeholder="Numer Telefonu" className={inputStyle} />
          {errors.phone && <p className={errorStyle}>Nieprawidłowy numer telefonu</p>}
        </div>
        <div>
          <textarea {...register('message')} placeholder="Wiadomość*" className="min-h-[60px] w-full border border-primary bg-background p-2.5 outline-none focus:border-primary focus:text-primary" rows={5} />
          {errors.message && <p className={errorStyle}>Nieprawidłowa wiadomość</p>}
        </div>
        <div>
          {!firstRender && <ReCAPTCHA size="invisible" sitekey={import.meta.env.PUBLIC_RECAPTCHA} ref={recaptchaRef} />}
          <button className={`ml-auto block rounded-2xl bg-secondary px-6 py-3 text-background hover:bg-opacity-80 md:px-12 md:py-6 md:text-2xl ${loading ? 'bg-opacity-80' : ''}`}>Wyślij</button>
        </div>
      </form>
    </>
  );
}
