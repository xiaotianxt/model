export default function Playground() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <div>Control panel</div>
      <div className="flex flex-1 flex-col min-h-full min-w-full justify-center items-center place-items-center">
        Main Canvas
      </div>
      <div>Event log</div>
    </main>
  );
}
