import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in · MethG Staff' };

export default function LoginPage() {
  return (
    <main className="login">
      <div className="logo-card"><img src="/brand/logo.png" alt="MethG Pvt Ltd" /></div>
      <h1>Sign in</h1>
      <p className="lead">Use the username your manager gave you.</p>
      <LoginForm />
      <p className="hint">Forgot your login? Ask your manager.</p>
    </main>
  );
}
