type Props = {
  onStart: () => void;
};

export function IdleScreen({ onStart }: Props) {
  return (
    <>
      <h1 className='logo' style={{ marginTop: 0, marginBottom: 0 }}>
        <span className='material-symbols-rounded'>hourglass</span>
        <br />
        PlankFlow
      </h1>

      <p style={{ maxWidth: 320, marginTop: 12, marginBottom: 32 }}>
        Stay focused through a full plank routine, timed and structured for you.
      </p>

      <button className='start-button' onClick={onStart}>
        Get started
      </button>
    </>
  );
}
