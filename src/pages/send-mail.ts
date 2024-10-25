import z from 'zod';
import nodemailer from 'nodemailer';
import type { APIRoute } from 'astro';

export const prerender = false;

const RequestSchema = z.object({
  name: z.string().min(1).max(100),
  mail: z.string().max(100).email(),
  phone: z.string().max(100).optional(),
  content: z.string().min(1).max(500),
  token: z.string(),
});
type Request = z.infer<typeof RequestSchema>;

const CaptchaResponseSchema = z.object({
  success: z.boolean(),
  challenge_ts: z.string(),
  score: z.number(),
  hostname: z.string(),
});

type CaptchaResponse = z.infer<typeof CaptchaResponseSchema>;

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.HOST || !import.meta.env.PORT || !import.meta.env.SENDER || !import.meta.env.PASSWORD || !import.meta.env.RECAPTCHA_PRIVATE_KEY || !import.meta.env.RECEIVER)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });

  let validatedBody: Request;
  try {
    const jsonBody = await request.json();
    validatedBody = RequestSchema.parse(jsonBody);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ message: 'Invalid data' }), { status: 400 });
  }

  const captcha = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${import.meta.env.RECAPTCHA_PRIVATE_KEY}&response=${validatedBody.token}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
    method: 'POST',
  });

  let captchaResponse: CaptchaResponse;
  try {
    const jsonCaptchaResponse = await captcha.json();
    captchaResponse = CaptchaResponseSchema.parse(jsonCaptchaResponse);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ message: 'Invalid data' }), { status: 401 });
  }

  if (!captchaResponse.success || captchaResponse.score < 0.5) return new Response(JSON.stringify({ message: 'Invalid captcha' }), { status: 401 });

  const transporter = nodemailer.createTransport({
    host: import.meta.env.HOST,
    port: parseInt(import.meta.env.PORT),
    secure: import.meta.env.PORT === '465',
    auth: {
      user: import.meta.env.SENDER,
      pass: import.meta.env.PASSWORD,
    },
  });

  const email = {
    from: import.meta.env.SENDER, // sender address
    to: import.meta.env.RECEIVER, // list of receivers
    subject: 'Formularz kontaktowy - wiadomość automatyczna', // Subject line
    text: `Imię i nazwisko: ${validatedBody.name}\nNumer telefonu: ${validatedBody.phone}\nAdres email: ${validatedBody.mail}\nTreść wiadomości:\n${validatedBody.content}`, // plain text body
  };

  // transporter.sendMail(email, (err, inf) => {
  //   if (err) return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  //   return new Response(JSON.stringify({ message: inf.messageId }), { status: 200 });
  // });

  try {
    const info = await transporter.sendMail(email);
    return new Response(JSON.stringify({ message: info.messageId }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};
