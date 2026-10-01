import { TitleBar } from './Chrome';

// Shown the instant you tap, while the server fetches the real screen.
export function ListSkeleton() {
  return (
    <main className="page" aria-busy="true" aria-label="Loading">
      <div className="sk sk-title" />
      <div className="sk sk-block" />
      <div className="list sk-list">
        <div className="sk-row"><span className="sk sk-line" /><span className="sk sk-line short" /></div>
        <div className="sk-row"><span className="sk sk-line" /><span className="sk sk-line short" /></div>
        <div className="sk-row"><span className="sk sk-line" /><span className="sk sk-line short" /></div>
      </div>
    </main>
  );
}

export function FormSkeleton({ title }) {
  return (
    <>
      <TitleBar title={title} />
      <main className="page bare" aria-busy="true" aria-label="Loading">
        <div className="sk sk-field" />
        <div className="sk sk-field" />
        <div className="sk sk-field" />
        <div className="sk sk-area" />
      </main>
    </>
  );
}
